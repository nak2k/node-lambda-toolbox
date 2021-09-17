import { errToSlack as orgErrToSlack, ErrToSlackOptions } from "err-to-slack";

export { ErrToSlackOptions };

export async function errToSlack(err: any, options: ErrToSlackOptions = {}) {
  if (!err) {
    return;
  }

  const {
    AWS_LAMBDA_FUNCTION_NAME,
    AWS_LAMBDA_LOG_GROUP_NAME,
    AWS_LAMBDA_LOG_STREAM_NAME,
    AWS_REGION,
  } = process.env;

  const attachments: ErrToSlackOptions["attachments"] = [...(options.attachments || [])];

  const title_link = AWS_LAMBDA_LOG_GROUP_NAME && AWS_LAMBDA_LOG_STREAM_NAME &&
    `https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home#logsV2:log-groups/log-group/${encodeURIComponent(AWS_LAMBDA_LOG_GROUP_NAME)}/log-events/${encodeURIComponent(AWS_LAMBDA_LOG_STREAM_NAME)}`;

  attachments.push({
    title: String(AWS_LAMBDA_FUNCTION_NAME),
    title_link,
    color: "danger",
  });

  return orgErrToSlack(err, {
    ...options,
    attachments,
  });
}
