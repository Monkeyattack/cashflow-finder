import { multiSourceImporter } from '../services/multiSourceImporter.js';

async function importFromAllSources() {
  console.log('🚀 Starting multi-source business data import...\n');
  
  try {
    const results = await multiSourceImporter.importFromAllSources({
      priceRange: { min: 50000, max: 5000000 },
      industries: ['Technology', 'E-commerce', 'Professional Services', 'Food & Beverage', 'Healthcare'],
      includeTech: true,
      includeRemote: true
    });
    
    console.log('\n📊 Multi-Source Import Results:');
    console.log('═'.repeat(50));
    
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    Object.entries(results).forEach(([source, stats]: [string, any]) => {
      console.log(`${source.toUpperCase()}:`);
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
    
    console.log('\n🎉 Multi-source import completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up real API keys for each platform');
    console.log('2. Implement actual scraping for Craigslist and Twitter');
    console.log('3. Add scheduled imports for continuous data updates');
    console.log('4. Monitor data quality and user engagement');
    
  } catch (error) {
    console.error('❌ Multi-source import failed:', error);
    process.exit(1);
  }
}

// Run the import
importFromAllSources()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

export { importFromAllSources };