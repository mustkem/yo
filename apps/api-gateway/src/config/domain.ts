import { env } from './env';

const webAppDomainEnum: { [key: string]: string } = {
  prod: 'yo.xyz',
  staging: 'staging.yo.xyz',
  next: 'd16pnb5iumozom.cloudfront.net',
  dev: 'dev.yo.xyz',
};

const backendDomainEnum: { [key: string]: string } = {
  prod: 'api.prod.yo.xyz',
  staging: 'api.staging.yo.xyz',
  next: 'api.next.yo.xyz',
  dev: 'api.dev.yo.xyz',
};

const webDomainEnum: { [key: string]: string } = {
  prod: 'web.api.prod.yo.xyz',
  staging: 'api.staging.yo.xyz',
  next: 'api.next.yo.xyz',
  dev: 'api.dev.yo.xyz',
};

const mobileDomainEnum: { [key: string]: string } = {
  prod: 'mobile.api.prod.yo.xyz',
  staging: 'api.staging.yo.xyz',
  next: 'api.next.yo.xyz',
  dev: 'api.dev.yo.xyz',
};

export const domain = {
  baseDomain: backendDomainEnum[env.currentEnv] || 'localhost',
  webDomain: webDomainEnum[env.currentEnv] || 'localhost',
  // TODO: fixed it when official domain released
  webAppDomain: webAppDomainEnum[env.currentEnv] || 'localhost',
  mobileDomain: mobileDomainEnum[env.currentEnv] || 'localhost',
  localDomain: process.env.LOCAL_DOMAIN || `localhost`, // `localhost` or `api.yo.xyz` depends on proxy
  walletWebsite: env.isProduction
    ? 'https://omi.yo.xyz'
    : `https://omi.${env.currentEnv}.yo.xyz`,
};
export const deepLinkBaseDomain = env.isProduction ? 'yo' : 'yodebug';
