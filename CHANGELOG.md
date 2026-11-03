# Changelog

All notable changes to MatheManager are documented here.

## [Unreleased]

### Added
- Payment-status filter on the billing overview: paid, unpaid, or all; payment amounts are calculated from the selected rows.
- Independent paid/unpaid status for each student in a group appointment, including a "Teilweise" indicator in the dashboard.
- Automatic credit payment now settles each unpaid group participant against that student's family balance.

### Changed
- Billing totals default to paid appointments, so outstanding appointments are not counted as received income.
- README documents the current billing, family-credit, and group-payment behavior.

### Fixed
- Imported backups without explicit payment data no longer infer payment from `attended` or `canceled_paid`; missing state defaults to unpaid.
- When participant-level statuses exist, the aggregate `isPaid` flag is derived from those participant entries.
- Scheduling tests now assert that the lunch-break display block does not block or split placeholder slots.
- Invoice utility test fixtures use the `appointmentId` field consumed by the builder.
- Test coverage now includes payment totals and participant-level payment states to prevent regressions in this area.

## [1.4.0]

### Added
- Family credit balances with a transaction history.
- Automatic credit payment when an appointment is marked attended or paid-canceled; paid cancellations are charged at half price.
- Payment state is visible in the dashboard and billing overview.

### Changed
- Slot generation supports 60- and 90-minute appointments, flexible breaks, and lunch periods that are displayed but do not block scheduling.
- Invoice generation uses the date-filtered appointment list and browser print dialog for PDF output.
- Billing shows total teaching time as hours and minutes.
