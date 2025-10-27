export const env = {
  currentEnv: process.env.APP_ENV || '',
  isTest: process.env.APP_ENV === 'test',
  isBuild: process.env.APP_ENV === 'build',
  isLocal: process.env.APP_ENV === 'local',
  isDevelopment: process.env.APP_ENV === 'dev',
  isNext: process.env.APP_ENV === 'next',
  isStaging: process.env.APP_ENV === 'staging',
  isProduction: process.env.APP_ENV === 'prod',
  isLambda:
    !!process.env.AWS_EXECUTION_ENV &&
    process.env.AWS_EXECUTION_ENV.indexOf('AWS_Lambda_') !== -1,
}
