import express from 'express';
import Stripe from 'stripe';
import Nft from '../models/Nft.js';
import manifoldService from '../services/manifoldService.js';

// Integración de NFTs de Manifold con pagos de Stripe

const nftApi = (app) => {
  // Obtener todos los NFTs disponibles
  app.get('/api/nfts', async (req, res) => {
    try {
      const nfts = await Nft.find({ minted: false });
      res.json(nfts);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener NFTs', error: err });
    }
  });

  // Crear una sesión de compra para un NFT
  app.post('/api/nfts/buy', async (req, res) => {
    const { nftId, email } = req.body;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    try {
      const nft = await Nft.findById(nftId);
      if (!nft) {
        return res.status(404).json({ error: 'NFT no encontrado' });
      }
      
      // Crear una sesión de Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: `NFT: ${nft.name}`,
              description: nft.description,
              images: [nft.image],
            },
            unit_amount: nft.price * 100, // Convertir a céntimos
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/nft-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/nfts`,
        customer_email: email,
        metadata: {
          nftId: nft._id.toString(),
          customerEmail: email,
          nftName: nft.name
        }
      });
      
      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Error creando la sesión de compra de NFT:', error);
      return res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint para crear un nuevo NFT en el catálogo (sin mintear)
  app.post('/api/nfts', async (req, res) => {
    const { name, description, image, price, metadata } = req.body;
    
    if (!name || !image || !price) {
      return res.status(400).json({ error: 'Nombre, imagen y precio son obligatorios.' });
    }
    
    try {
      const nft = new Nft({
        name,
        description,
        image,
        price,
        metadata: metadata || {}
      });
      
      const savedNft = await nft.save();
      return res.status(201).json(savedNft);
    } catch (error) {
      console.error('Error al crear NFT:', error);
      return res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint para reclamar un NFT (enviar a la wallet del usuario)
  app.post('/api/nfts/claim', async (req, res) => {
    const { sessionId, walletAddress } = req.body;
    
    if (!sessionId || !walletAddress) {
      return res.status(400).json({ error: 'Se requiere el ID de sesión y la dirección de wallet' });
    }
    
    try {
      // Verificar que la dirección de wallet sea válida
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'Dirección de wallet inválida' });
      }
      
      // Buscar el NFT por ID de sesión
      const nft = await Nft.findOne({ paymentId: sessionId });
      if (!nft) {
        return res.status(404).json({ error: 'NFT no encontrado o pago no completado' });
      }
      
      // Verificar que no haya sido reclamado ya
      if (nft.owner) {
        return res.status(400).json({ error: 'Este NFT ya ha sido reclamado' });
      }
      
      // Transferir el NFT usando Manifold
      const tokenId = nft.metadata?.manifoldTokenId;
      if (!tokenId) {
        return res.status(400).json({ error: 'No hay ID de token disponible para este NFT' });
      }
      
      const transferResult = await manifoldService.transferToken(tokenId, walletAddress);
      
      // Actualizar el estado del NFT en nuestra base de datos
      nft.owner = walletAddress;
      nft.minted = true;
      nft.mintedAt = new Date();
      await nft.save();
      
      return res.status(200).json({
        success: true,
        message: 'NFT transferido con éxito',
        txHash: transferResult.txHash,
        tokenId
      });
    } catch (error) {
      console.error('Error al reclamar NFT:', error);
      return res.status(500).json({ error: error.message });
    }
  });
  
  // Webhook para procesar pagos exitosos de Stripe
  app.post('/api/nfts/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const signature = req.headers['stripe-signature'];
      
      try {
        // Verificar que el evento viene de Stripe
        const event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Solo procesar eventos de pago completado
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          
          // Buscar el NFT por ID en los metadatos
          const nftId = session.metadata.nftId;
          const nft = await Nft.findById(nftId);
          
          if (!nft) {
            console.error('NFT no encontrado:', nftId);
            return res.status(404).send('NFT no encontrado');
          }
          
          // Reservar el NFT para este comprador
          nft.paymentId = session.id;
          
          // Guardar el token ID de Manifold en los metadatos, esto es importante
          // para cuando el usuario reclame su NFT
          if (!nft.metadata) nft.metadata = {};
          
          // Aquí asignamos un tokenId específico de Manifold para este NFT
          // Puedes mapear cada NFT a un tokenId específico o usar una lógica personalizada
          nft.metadata.manifoldTokenId = process.env.MANIFOLD_TOKEN_ID || '4276724384'; // ID del token en Manifold
          
          await nft.save();
          
          console.log(`✅ Pago completado para NFT: ${nft.name}. Session ID: ${session.id}`);
        }
        
        res.status(200).send({ received: true });
      } catch (error) {
        console.error('Error en webhook de Stripe:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
      }
    }
  );
  
  // Verificar estado de un NFT comprado
  app.get('/api/nfts/status/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    
    try {
      // Buscar en la colección de NFTs
      let nft = await Nft.findOne({ paymentId: sessionId });
      
      // Si no encuentra el NFT, intentar buscar la información de Stripe directamente
      if (!nft) {
        console.log(`NFT no encontrado en BD para sesión ${sessionId}. Consultando Stripe...`);
        
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          
          if (session && session.payment_status === 'paid') {
            // Extraer información relevante de los metadatos de la sesión
            const nftId = session.metadata?.nftId || session.metadata?.lazyId || null;
            const type = session.metadata?.type || 'product';
            
            console.log(`Sesión encontrada en Stripe. Tipo: ${type}, ID: ${nftId}`);
            
            // Si es un NFT (aunque sea tipo 'product'), crear una representación temporal
            if (nftId || type.includes('nft') || type === 'lazy_mint') {
              // Intentar crear automáticamente un registro en la BD
              try {
                const newNft = new Nft({
                  name: session.metadata?.name || `NFT #${sessionId.substring(sessionId.length - 6)}`,
                  description: "NFT Exclusivo de Nani Boronat",
                  image: "https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png",
                  price: session.amount_total / 100,
                  metadata: {
                    manifoldTokenId: nftId,
                    type: 'lazy_mint',
                    sessionId: sessionId
                  },
                  tokenId: nftId,
                  paymentId: sessionId
                });
                
                await newNft.save();
                console.log(`✅ NFT creado en base de datos para sesión ${sessionId}`);
                
                return res.status(200).json({
                  nft: {
                    name: newNft.name,
                    image: newNft.image,
                    description: newNft.description,
                    tokenId: nftId,
                    minted: false,
                    owner: null,
                    mintedAt: null
                  }
                });
              } catch (saveError) {
                console.error('Error al guardar NFT en BD:', saveError);
                // Si falla el guardado, continuamos con la respuesta temporal
                return res.status(200).json({
                  nft: {
                    name: session.metadata?.name || `NFT #${sessionId.substring(sessionId.length - 6)}`,
                    image: "https://naniboronat.com/wp-content/uploads/2023/11/naniboronat.png",
                    description: "NFT Exclusivo de Nani Boronat",
                    tokenId: nftId,
                    minted: false,
                    owner: null,
                    mintedAt: null
                  }
                });
              }
            }
          }
        } catch (stripeError) {
          console.error('Error consultando Stripe:', stripeError);
        }
        
        return res.status(404).json({ error: 'NFT no encontrado o pago no completado' });
      }
      
      // Si encontramos el NFT en la base de datos, devolvemos su información
      return res.status(200).json({
        nft: {
          name: nft.name,
          image: nft.image,
          description: nft.description,
          tokenId: nft.metadata?.manifoldTokenId || nft.tokenId,
          minted: nft.minted,
          owner: nft.owner || null,
          mintedAt: nft.mintedAt
        }
      });
    } catch (error) {
      console.error('Error al verificar estado de NFT:', error);
      return res.status(500).json({ error: error.message });
    }
  });
};

export default nftApi;
