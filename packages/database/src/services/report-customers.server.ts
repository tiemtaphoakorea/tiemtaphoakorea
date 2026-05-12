/**
 * Customers reports barrel — re-exports all customer report services.
 *
 * Callers import from `@workspace/database/services/report-customers.server`.
 */

export {
  getCustomerAggregate,
  type CustomerAggregateRow,
  type CustomerAggregateReport,
} from "./report-customers-top.server";

export {
  getCustomersByProduct,
  getCustomersForVariant,
  type CustomersByProductRow,
  type CustomersByProductReport,
  type VariantCustomerRow,
} from "./report-customers-by-product.server";

export {
  getNewVsReturningReport,
  getCustomersInBucket,
  type SegmentBucket,
  type SegmentBucketRow,
  type SegmentTimeSeries,
  type NewVsReturningReport,
  type BucketCustomerRow,
} from "./report-customers-segmentation.server";
