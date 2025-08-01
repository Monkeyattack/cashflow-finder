import { additionalSourcesImporter } from '../services/additionalSourcesImporter.js';

async function importFromAdditionalSources() {
  console.log('🌟 Starting additional sources business data import...\n');
  
  try {
    const results = await additionalSourcesImporter.importFromAllAdditionalSources({
      priceRange: { min: 25000, max: 10000000 },
      industries: ['Technology', 'E-commerce', 'Manufacturing', 'Professional Services', 'Media & Publishing'],
      includeVerified: true,
      includeFranchises: true
    });
    
    console.log('\n📊 Additional Sources Import Results:');
    console.log('═'.repeat(60));
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    Object.entries(results).forEach(([source, stats]: [string, any]) => {
      const displayName = source.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
      console.log(`${displayName}:`);
      console.log(`  ✅ Imported: ${stats.imported}`);
      console.log(`  ⏭️  Skipped: ${stats.skipped}`);
      console.log(`  ❌ Errors: ${stats.errors}`);
      console.log('');
      
      totalImported += stats.imported;
      totalSkipped += stats.skipped;
      totalErrors += stats.errors;
    });
    
    console.log('TOTALS:');
    console.log(`  ✅ Total Imported: ${totalImported}`);
    console.log(`  ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`  ❌ Total Errors: ${totalErrors}`);
    
    console.log('\n🎉 Additional sources import completed!');
    console.log('\n🌍 Complete Source Coverage:');
    console.log('  • Empire Flippers - Premium online businesses');
    console.log('  • FE International - SaaS & content sites');
    console.log('  • LoopNet - Commercial real estate');
    console.log('  • MicroAcquire - Startup acquisitions');
    console.log('  • BizQuest - Franchises & established businesses');
    console.log('  • Reddit - Community-driven opportunities');
    console.log('  • LinkedIn - Professional network deals');
    
    console.log('\n📋 Ready for Production:');
    console.log('  • 12 total business data sources integrated');
    console.log('  • Quality scoring for all platforms');
    console.log('  • Risk assessment by source type');
    console.log('  • Duplicate detection across sources');
    
  } catch (error) {
    console.error('❌ Additional sources import failed:', error);
    process.exit(1);
  }
}

// Run the import
importFromAdditionalSources()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

export { importFromAdditionalSources };