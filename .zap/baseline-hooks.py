"""Seed required routes through ZAP; retain evidence without authentication headers."""

import json
import os
import re
from email.parser import Parser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

WORKDIR = Path('/zap/wrk')


def manifest():
    return json.loads((WORKDIR / 'target.json').read_text())


def zap_started(zap, target):
    if target != manifest()['url']:
        raise ValueError('ZAP target does not match the verified preview')
    # Traditional spider only. Never submit forms or crawl another origin.
    zap.spider.exclude_from_scan(r'^(?!' + re.escape(target) + r').*')
    zap.spider.set_option_process_form(False)
    zap.spider.set_option_post_form(False)
    zap.spider.set_option_thread_count(2)
    zap.spider.set_option_max_depth(3)
    zap.pscan.set_scan_only_in_scope(True)
    for header, variable in [('CF-Access-Client-Id', 'CF_ACCESS_CLIENT_ID'),
                             ('CF-Access-Client-Secret', 'CF_ACCESS_CLIENT_SECRET')]:
        if os.environ.get(variable):
            zap.replacer.add_rule(description=header, enabled=True,
                                  matchtype='REQ_HEADER', matchregex=False,
                                  matchstring=header, replacement=os.environ[variable],
                                  url='^' + re.escape(target) + '.*')


def fetch_route(zap, base, route):
    url = urljoin(base, route['path'])
    for _ in range(4):
        if urlsplit(url)[:2] != urlsplit(base)[:2]:
            raise ValueError('Refusing a redirect outside the verified preview')
        messages = zap.core.access_url(url, followredirects=False)
        if not isinstance(messages, list) or len(messages) != 1:
            raise ValueError('ZAP could not fetch ' + route['path'])
        message = messages[0]
        lines = message['responseHeader'].splitlines()
        status = int(lines[0].split()[1])
        headers = Parser().parsestr('\n'.join(lines[1:]))
        if status in (301, 302, 303, 307, 308):
            location = headers.get('Location')
            if not location:
                raise ValueError('Redirect has no Location: ' + route['path'])
            url = urljoin(url, location)
            continue
        if status != route['status']:
            raise ValueError(f"{route['path']}: expected HTTP {route['status']}, got {status}")
        body = message.get('responseBody', '')
        content_type = headers.get('Content-Type', '')
        if route['path'].endswith('.json'):
            if 'application/json' not in content_type.lower():
                raise ValueError('Expected policy JSON, not an authentication/error page')
            policy = json.loads(body)
            if not isinstance(policy, dict) or not all(key in policy for key in ('terms', 'privacy', 'support')):
                raise ValueError('Missing policy JSON sections')
        elif 'text/html' not in content_type.lower() or not re.search(r'id=[\"\']main-content[\"\']', body) or 'Calendar ToDo' not in body:
            raise ValueError('Expected website HTML, not an authentication/challenge/error page')
        return {'path': route['path'], 'finalURL': url, 'status': status, 'contentType': content_type}
    raise ValueError('Too many redirects: ' + route['path'])


def zap_access_target(zap, target):
    coverage = {'complete': False, 'pages': []}
    try:
        context = zap.context.context('CalendarToDo preview')
        if not isinstance(context, dict) or str(context.get('inScope')).lower() != 'true':
            raise ValueError('Verified preview was not imported into the ZAP context')
        for route in manifest()['routes']:
            coverage['pages'].append(fetch_route(zap, target, route))
        coverage['complete'] = True
    except Exception as error:
        coverage['error'] = str(error)
        raise
    finally:
        (WORKDIR / 'coverage.json').write_text(json.dumps(coverage, indent=2) + '\n')


def zap_pre_shutdown(zap):
    if int(zap.pscan.records_to_scan) != 0:
        raise ValueError('Passive scan did not finish before the time limit')
    urls = zap.core.urls()
    (WORKDIR / 'urls.json').write_text(json.dumps(urls, indent=2) + '\n')
    origin = urlsplit(manifest()['url'])[:2]
    if not urls or any(urlsplit(url)[:2] != origin for url in urls):
        raise ValueError('ZAP visited URLs outside the verified preview, or visited none')
