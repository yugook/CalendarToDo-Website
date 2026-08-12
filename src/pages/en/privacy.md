---
layout: ../../layouts/LegalLayout.astro
locale: en
title: Calendar ToDo Privacy Policy
description: Privacy Policy for Calendar ToDo.
documentTitle: Privacy Policy
updatedAt: '2026-08-12'
canonicalPath: /en/privacy/
alternatePaths:
  ja: /privacy/
  en: /en/privacy/
---

Calendar ToDo (the "App") respects your privacy and aims to provide transparency about how data is handled.

## Information We Access and Store

- Calendar Data: We access event titles, notes, times, recurrence information, locations, attendee counts, calendar names, colors, sources, and identifiers via EventKit to display, record, classify, and analyze events. The App does not edit your calendar events.
- In-App Records: Completion state, progress, reflections, classification metadata, history, and diagnostic records (such as internal error states and relinking metadata) are stored locally on your device via Core Data. These records include snapshots of event metadata (title, time, coarse location kind, and calendar details) to preserve history and analytics. The note excerpt and prompt supplied to Apple Intelligence are not stored.
- iCloud Sync (Optional): If enabled, your in-app records are synced only to your private iCloud storage via Apple CloudKit.
- On-Device Apple Intelligence Processing (Supported Devices and Languages Only): To assist event classification, Apple's Foundation Models process the current event title, a note excerpt of up to 500 characters, schedule and recurrence facts, attendee count, a coarse location kind, and up to five normalized titles with classification facts from relevant confirmed history on device. Structured attendee names or email addresses, the EventKit URL field, and coordinates are not separately supplied. However, user-entered titles and notes are processed without redaction or anonymization and may contain personal information. Weekly insights use aggregate facts rather than event title or note text.
- Retention: Data remains on your device and in iCloud until you delete the App or remove the App's iCloud data.

## How We Use Information

To provide event display, completion, progress and reflection recording, event classification, analytics, and data relinking.

## Data Sharing and Transmission

- No Developer Server: No data is transmitted to servers operated by us.
- Third Parties: We do not sell or share your data for tracking or advertising.
- Apple Intelligence: On supported devices, the App uses Apple's Foundation Models on device. Calendar data is not sent to the developer or an external AI service. When Apple Intelligence is unavailable, the App uses confirmed history and deterministic local rules.
- Apple Services: We use iCloud/CloudKit for sync and StoreKit for subscriptions.

## Your Choices

- You can revoke Calendar access in iOS Settings.
- You can disable iCloud sync for the App in iOS Settings.
- Deleting the App removes local data. To remove iCloud data, delete the App's iCloud data from iOS Settings (labels and steps may vary by iOS version).

## Security

We implement reasonable security measures to protect your data stored locally and in iCloud.

## Contact

[yugo.work.contact@gmail.com](mailto:yugo.work.contact@gmail.com)
