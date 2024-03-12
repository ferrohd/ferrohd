/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: process.env.SITE_URL || 'https://alessandro.ferrara.it',
    generateRobotsTxt: true,
    changefreq: 'monthly',
};
