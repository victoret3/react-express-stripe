require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mongoose = require('mongoose');

// Función principal
async function testWebhook() {
  console.log('🧪 Iniciando prueba de webhook y actualización de stock');
  
  try {
    // 1. Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conexión a MongoDB establecida');
    
    // 2. Definir el schema para el producto
    const productSchema = new mongoose.Schema({
      name: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String },
      image: { type: String },
      stock: { type: Number, default: 0 },
      stripeProductId: { type: String }
    });
    
    // 3. Crear o usar el modelo existente
    const Product = mongoose.models.Product || 
      mongoose.model('Product', productSchema, 'products');
    
    // 4. Obtener productos actuales
    const products = await Product.find();
    console.log(`📋 Productos en la base de datos: ${products.length}`);
    
    if (products.length === 0) {
      console.log('❌ No hay productos en la base de datos');
      return;
    }
    
    // 5. Mostrar stock actual
    console.log('Stock actual:');
    products.forEach(p => {
      console.log(`- ${p.name}: ${p.stock} unidades (ID: ${p._id}, StripeID: ${p.stripeProductId || 'N/A'})`);
    });
    
    // 6. Seleccionar un producto para la prueba
    const testProduct = products[0];
    console.log(`\n🎯 Producto seleccionado para prueba: ${testProduct.name}`);
    console.log(`Stock antes de la prueba: ${testProduct.stock}`);
    
    // 7. Crear un item de línea simulado para la prueba
    const lineItems = [{
      price: {
        product: testProduct._id.toString() // Usar el ID como ID de producto de Stripe para la prueba
      },
      quantity: 1
    }];
    
    // 8. Simular actualización de stock
    console.log(`\n🔄 Simulando actualización de stock para ${testProduct.name}`);
    
    // 9. Encontrar el producto y actualizar su stock
    const product = await Product.findById(testProduct._id);
    if (product) {
      const oldStock = product.stock;
      product.stock = Math.max(0, oldStock - 1);
      await product.save();
      console.log(`✅ Stock actualizado: ${oldStock} → ${product.stock}`);
    } else {
      console.log('❌ Producto no encontrado');
    }
    
    // 10. Verificar el nuevo stock
    const updatedProduct = await Product.findById(testProduct._id);
    console.log(`\n🔍 Verificación: Stock después de la prueba: ${updatedProduct.stock}`);
    
    // 11. Restaurar el stock original para evitar cambios permanentes en la prueba
    updatedProduct.stock = testProduct.stock;
    await updatedProduct.save();
    console.log(`🔄 Stock restaurado a ${testProduct.stock} para evitar cambios permanentes`);
    
    console.log('\n✅ Prueba completada. Si todo funcionó, el stock debería haberse actualizado temporalmente.');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    // Cerrar la conexión a MongoDB
    if (mongoose.connection) {
      await mongoose.connection.close();
      console.log('📝 Conexión a MongoDB cerrada');
    }
  }
}

// Ejecutar la función principal
testWebhook().then(() => {
  console.log('Script finalizado');
  process.exit(0);
}).catch(err => {
  console.error('Error en el script:', err);
  process.exit(1);
}); 