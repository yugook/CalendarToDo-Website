import importlib.util
import json
import os
import re
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('baseline_hooks', Path(__file__).parents[1] / '.zap/baseline-hooks.py')
hooks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hooks)
BASE = 'https://1234abcd.calendartodo-website.pages.dev/'


def response(status=200, body='<main id="main-content">Calendar ToDo</main>', headers='Content-Type: text/html'):
    return [{'responseHeader': f'HTTP/1.1 {status} Response\r\n{headers}\r\n\r\n', 'responseBody': body}]


class BaselineHooksTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.workdir = Path(self.directory.name)
        self.patch = patch.object(hooks, 'WORKDIR', self.workdir)
        self.patch.start()
        self.addCleanup(self.patch.stop)
        self.routes = [{'path': '/', 'status': 200}, {'path': '/legal/policy.json', 'status': 200},
                       {'path': '/__zap_missing_page__/', 'status': 404}]
        (self.workdir / 'target.json').write_text(json.dumps({'url': BASE, 'routes': self.routes}))
        self.zap = Mock()
        self.zap.context.context.return_value = {'inScope': 'true'}

    def test_seeds_json_and_404_through_zap_instead_of_relying_on_spider(self):
        self.zap.core.access_url.side_effect = [response(), response(body='{"terms":{},"privacy":{},"support":{}}',
            headers='Content-Type: application/json'), response(status=404)]
        hooks.zap_access_target(self.zap, BASE)
        coverage = json.loads((self.workdir / 'coverage.json').read_text())
        self.assertTrue(coverage['complete'])
        self.assertEqual(len(coverage['pages']), 3)
        self.assertEqual(self.zap.core.access_url.call_count, 3)

    def test_rejects_external_redirect_before_sending_a_request_to_it(self):
        self.zap.core.access_url.return_value = response(302, headers='Location: https://login.example/')
        with self.assertRaisesRegex(ValueError, 'outside'):
            hooks.fetch_route(self.zap, BASE, self.routes[0])
        self.assertEqual(self.zap.core.access_url.call_count, 1)
        self.zap.core.access_url.assert_called_with(BASE, followredirects=False)

    def test_accepts_bounded_canonical_redirect_on_the_same_preview(self):
        self.zap.core.access_url.side_effect = [response(308, headers='Location: /404'), response()]
        page = hooks.fetch_route(self.zap, BASE, {'path': '/404.html', 'status': 200})
        self.assertEqual(page['finalURL'], BASE + '404')

    def test_rejects_redirect_loop(self):
        self.zap.core.access_url.return_value = response(302, headers='Location: /')
        with self.assertRaisesRegex(ValueError, 'Too many redirects'):
            hooks.fetch_route(self.zap, BASE, self.routes[0])
        self.assertEqual(self.zap.core.access_url.call_count, 4)

    def test_rejects_http_errors_login_pages_and_missing_policy_sections(self):
        for reply, route in [(response(403), self.routes[0]),
                             (response(body='<title>Sign in</title>'), self.routes[0]),
                             (response(body='{}', headers='Content-Type: application/json'), self.routes[1]),
                             (response(200), self.routes[2])]:
            with self.subTest(reply=reply):
                self.zap.core.access_url.return_value = reply
                with self.assertRaises(ValueError):
                    hooks.fetch_route(self.zap, BASE, route)

    def test_retains_incomplete_coverage_on_failure(self):
        self.zap.core.access_url.return_value = response(403)
        with self.assertRaises(ValueError):
            hooks.zap_access_target(self.zap, BASE)
        coverage = json.loads((self.workdir / 'coverage.json').read_text())
        self.assertFalse(coverage['complete'])
        self.assertIn('403', coverage['error'])

    def test_rejects_missing_or_out_of_scope_context(self):
        for context in [{}, {'inScope': 'false'}, 'does_not_exist']:
            self.zap.context.context.return_value = context
            with self.assertRaisesRegex(ValueError, 'context'):
                hooks.zap_access_target(self.zap, BASE)
        self.zap.core.access_url.assert_not_called()

    def test_authentication_rules_are_limited_to_the_verified_origin(self):
        with patch.dict(os.environ, {'CF_ACCESS_CLIENT_ID': 'test-id', 'CF_ACCESS_CLIENT_SECRET': 'test-secret'}, clear=True):
            hooks.zap_started(self.zap, BASE)
        self.assertEqual(self.zap.replacer.add_rule.call_count, 2)
        for call in self.zap.replacer.add_rule.call_args_list:
            self.assertTrue(re.match(call.kwargs['url'], BASE + 'support/'))
            self.assertFalse(re.match(call.kwargs['url'], 'https://login.example/'))
        self.zap.spider.set_option_process_form.assert_called_once_with(False)
        self.zap.spider.set_option_post_form.assert_called_once_with(False)
        self.zap.pscan.set_scan_only_in_scope.assert_called_once_with(True)

    def test_rejects_mismatched_target_and_unfinished_passive_scan(self):
        with self.assertRaises(ValueError):
            hooks.zap_started(self.zap, 'https://calendartodo.app/')
        self.zap.pscan.records_to_scan = '1'
        with self.assertRaisesRegex(ValueError, 'did not finish'):
            hooks.zap_pre_shutdown(self.zap)

    def test_visited_origin_check_handles_bare_origins_and_rejects_other_hosts(self):
        self.zap.pscan.records_to_scan = '0'
        self.zap.core.urls.return_value = [BASE.rstrip('/'), BASE + 'support/']
        hooks.zap_pre_shutdown(self.zap)
        self.zap.core.urls.return_value = [BASE.rstrip('/') + '.evil.example/']
        with self.assertRaisesRegex(ValueError, 'outside'):
            hooks.zap_pre_shutdown(self.zap)


if __name__ == '__main__':
    unittest.main()
