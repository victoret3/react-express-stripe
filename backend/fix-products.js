require('dotenv').config();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function fixProducts() {
  console.log('🔄 Iniciando script para corregir productos...');

  try {
    // 1. Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión a MongoDB establecida');

    // 2. Definir el esquema del producto
    const productSchema = new mongoose.Schema({
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      image: { type: String },
      stock: { type: Number, default: 0 },
      stripeProductId: { type: String }
    });

    // 3. Obtener o crear modelo
    const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'products');

    // 4. Obtener productos de MongoDB
    const products = await Product.find();
    console.log(`📋 Productos en MongoDB: ${products.length}`);

    // 5. Obtener productos de Stripe
    const stripeProducts = await stripe.products.list({ limit: 100 });
    console.log(`💳 Productos en Stripe: ${stripeProducts.data.length}`);

    // 6. Mostrar productos de Stripe
    console.log('\nProductos en Stripe:');
    stripeProducts.data.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id})`);
    });

    // 7. Mostrar productos en MongoDB
    console.log('\nProductos en MongoDB:');
    products.forEach(p => {
      console.log(`- ${p.name} (ID: ${p._id}, StripeID: ${p.stripeProductId || 'NO ASIGNADO'}, Stock: ${p.stock})`);
    });

    // 8. Preguntar si queremos actualizar los productos
    console.log('\n¿Quieres actualizar los productos de MongoDB con los IDs de Stripe? (s/n)');
    // En un script automático, asumimos que sí
    const answer = 's';

    if (answer.toLowerCase() === 's') {
      console.log('\n🔄 Actualizando productos...');

      // 9. Intentar encontrar coincidencias por nombre y actualizar
      for (const mongoProduct of products) {
        const matchingStripeProducts = stripeProducts.data.filter(
          sp => sp.name.toLowerCase() === mongoProduct.name.toLowerCase()
        );

        if (matchingStripeProducts.length === 1) {
          // Coincidencia única, actualizamos
          const stripeProduct = matchingStripeProducts[0];
          console.log(`✅ Coincidencia encontrada para ${mongoProduct.name}`);
          
          mongoProduct.stripeProductId = stripeProduct.id;
          await mongoProduct.save();
          
          console.log(`   StripeID asignado: ${stripeProduct.id}`);
        } else if (matchingStripeProducts.length > 1) {
          console.log(`⚠️ Múltiples coincidencias para ${mongoProduct.name}, selecciona manualmente`);
          // Aquí podríamos implementar un selector, pero por ahora mostramos las opciones
          matchingStripeProducts.forEach((sp, i) => {
            console.log(`   ${i+1}. ${sp.name} (${sp.id})`);
          });
        } else {
          console.log(`❌ No se encontró coincidencia para ${mongoProduct.name}`);
        }
      }

      console.log('\n✅ Proceso completado.');
      
      // 10. Mostrar productos actualizados
      const updatedProducts = await Product.find();
      console.log('\nProductos en MongoDB (actualizados):');
      updatedProducts.forEach(p => {
        console.log(`- ${p.name} (ID: ${p._id}, StripeID: ${p.stripeProductId || 'NO ASIGNADO'}, Stock: ${p.stock})`);
      });
    } else {
      console.log('Operación cancelada.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    if (mongoose.connection) {
      await mongoose.connection.close();
      console.log('📝 Conexión a MongoDB cerrada');
    }
  }
}

fixProducts().then(() => {
  console.log('Script finalizado');
  process.exit(0);
}).catch(err => {
  console.error('Error en el script:', err);
  process.exit(1);
}); 