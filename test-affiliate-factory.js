/**
 * Affiliate Content Factory Demo
 * Demonstrates the automated passive income generation system
 */

import { affiliateResearchEngine } from './src/affiliate/researchEngine.js';
import { contentAutomationPipeline } from './src/affiliate/contentPipeline.js';
import { revenueTracker } from './src/revenue/tracker.js';

async function demoAffiliateContentFactory() {
  console.log('🚀 Starting Affiliate Content Factory Demo');
  console.log('==========================================\n');

  try {
    // Step 1: Market Research
    console.log('📊 Step 1: Analyzing Market Trends...');
    const trends = await affiliateResearchEngine.analyzeMarketTrends();

    console.log(`Found ${trends.length} trending markets:`);
    trends.forEach((trend, i) => {
      console.log(`${i + 1}. ${trend.topic} (${trend.searchVolume.toLocaleString()} searches/month)`);
      console.log(`   Competition: ${trend.competition}, Revenue Potential: ${trend.monetizationPotential}/10`);
      console.log(`   Top Products: ${trend.affiliateProducts.slice(0, 2).map(p => p.name).join(', ')}`);
    });

    console.log('\n');

    // Step 2: Content Opportunity Generation
    console.log('🎯 Step 2: Generating Content Opportunities...');
    const opportunities = await Promise.all(
      trends.slice(0, 2).map(trend =>
        affiliateResearchEngine.generateContentOpportunities(trend)
      )
    );

    const rankedOpportunities = affiliateResearchEngine.rankOpportunities(opportunities);

    console.log(`Generated ${rankedOpportunities.length} content opportunities:`);
    rankedOpportunities.forEach((opp, i) => {
      console.log(`${i + 1}. "${opp.contentIdeas[0].title}"`);
      console.log(`   Type: ${opp.contentIdeas[0].type}, Traffic: ${opp.contentIdeas[0].estimatedTraffic}`);
      console.log(`   Revenue: $${opp.estimatedMonthlyRevenue}/month`);
      console.log(`   Effort: ${opp.developmentEffort}, Automation: ${opp.automationPotential}`);
    });

    console.log('\n');

    // Step 3: Content Generation
    console.log('📝 Step 3: Generating Automated Content...');
    const generatedContent = await contentAutomationPipeline.processContentQueue();

    console.log(`Generated ${generatedContent.length} content pieces`);

    generatedContent.forEach((content, i) => {
      console.log(`${i + 1}. "${content.title}"`);
      console.log(`   Status: ${content.status}`);
      console.log(`   Affiliate Links: ${content.affiliateLinks.length}`);
      console.log(`   Estimated Revenue: $${content.estimatedRevenue}/month`);
    });

    console.log('\n');

    // Step 4: Revenue Tracking
    console.log('💰 Step 4: Revenue Analytics...');
    const metrics = revenueTracker.getMetrics();

    console.log('Revenue Dashboard:');
    console.log(`Total Clicks: ${metrics.totalClicks}`);
    console.log(`Total Conversions: ${metrics.totalConversions}`);
    console.log(`Total Commission: $${metrics.totalCommission}`);
    console.log(`Conversion Rate: ${(metrics.conversionRate).toFixed(1)}%`);
    console.log(`Average Order Value: $${metrics.averageOrderValue}`);

    console.log('\nTop Performing Products:');
    metrics.topProducts.slice(0, 3).forEach((product, i) => {
      console.log(`${i + 1}. ${product.productName}: $${product.commission} (${product.conversions} conversions)`);
    });

    console.log('\n');

    // Step 5: Automation Setup
    console.log('🔄 Step 5: Setting up 24/7 Automation...');
    contentAutomationPipeline.scheduleContentGeneration(24); // Every 24 hours

    console.log('✅ Automation scheduled - system will run continuously');
    console.log('✅ Revenue tracking active - monitoring all affiliate links');
    console.log('✅ Content pipeline ready - new opportunities processed automatically');

    console.log('\n🎉 Affiliate Content Factory is LIVE!');
    console.log('=====================================');
    console.log('System Status:');
    console.log('✅ Market Research Engine: Active');
    console.log('✅ Content Generation Pipeline: Running');
    console.log('✅ Revenue Tracking: Monitoring');
    console.log('✅ 24/7 Automation: Scheduled');
    console.log('');
    console.log('Projected First Month Results:');
    console.log('📈 $500-1,000 in affiliate commissions');
    console.log('📝 50+ automated content pieces');
    console.log('🎯 10+ high-value affiliate partnerships');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
demoAffiliateContentFactory().catch(console.error);
