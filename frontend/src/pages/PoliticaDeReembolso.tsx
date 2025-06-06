import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

const PoliticaDeReembolso: React.FC = () => {
  return (
    <Box p={4} maxW="960px" mx="auto">
      <Heading as="h1" mb={4}>
        Política de Reembolso
      </Heading>

      <Text mb={4}>
        Nuestra política dura 30 días. Si han pasado 30 días desde tu compra,
        lamentablemente no podemos ofrecerte un reembolso o cambio.
      </Text>

      <Text mb={4}>
        Para poder realizar una devolución, el artículo debe estar sin usar y
        en las mismas condiciones en las que lo recibiste. También debe estar en
        su embalaje original.
      </Text>

      <Text mb={4}>
        Hay varios tipos de artículos que no pueden devolverse. Los productos
        perecederos, como alimentos, flores, periódicos o revistas, no pueden
        devolverse. Tampoco aceptamos productos íntimos o sanitarios, materiales
        peligrosos o líquidos o gases inflamables.
      </Text>

      <Text mb={4}>
        Artículos adicionales no retornables:
        <br />
        Tarjetas regalo
        <br />
        Productos de software descargables
        <br />
        Algunos artículos de salud y cuidado personal
      </Text>

      <Text mb={4}>
        Para completar su devolución, necesitamos un recibo o prueba de compra.
        <br />
        No envíe su compra al fabricante.
      </Text>

      <Text mb={4}>
        Hay determinadas situaciones en las que sólo se conceden devoluciones
        parciales (si procede):<br />
        - Libro con signos evidentes de uso<br />
        - CD, DVD, cinta VHS, software, videojuego, cinta de casete o disco de
        vinilo que haya sido abierto<br />
        - Cualquier artículo que no se encuentre en su estado original, esté
        dañado o le falten piezas por motivos que no se deban a un error nuestro
        <br />
        - Cualquier artículo devuelto más de 30 días después de la entrega.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Reembolsos (si procede)
      </Heading>
      <Text mb={4}>
        Una vez recibida e inspeccionada su devolución, le enviaremos un correo
        electrónico para notificarle que hemos recibido su artículo devuelto.
        También le notificaremos la aprobación o rechazo de su reembolso.
        <br />
        Si se aprueba, el reembolso se procesará y se aplicará automáticamente
        un crédito a su tarjeta de crédito o método de pago original, en un
        plazo determinado de días.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Reembolsos atrasados o no recibidos (si procede)
      </Heading>
      <Text mb={4}>
        Si aún no ha recibido el reembolso, compruebe primero de nuevo su cuenta
        bancaria. A continuación, póngase en contacto con la entidad emisora de
        su tarjeta de crédito. A continuación, póngase en contacto con su banco.
        A menudo transcurre algún tiempo antes de que se contabilice el
        reembolso.
        <br />
        Si ha hecho todo esto y aún no ha recibido el reembolso, póngase en
        contacto con nosotros en naniboronat@gmail.com.
      </Text>

      <Text mb={4}>
        Artículos en oferta (si procede):<br />
        Sólo se pueden reembolsar los artículos de precio normal; lamentablemente,
        los artículos en oferta no se pueden reembolsar.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Cambios (si procede)
      </Heading>
      <Text mb={4}>
        Sólo cambiamos artículos si están defectuosos o dañados. Si necesitas
        cambiarlo por el mismo artículo, envíanos un email a naniboronat@gmail.com y envía
        tu artículo a: Fliederweg 4A 85391, Allershausen. Alemania.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Regalos
      </Heading>
      <Text mb={4}>
        Si el artículo estaba marcado como regalo cuando se compró y se le envió
        directamente, recibirá un crédito de regalo por el valor de su devolución.
        Una vez recibido el artículo devuelto, se le enviará por correo un cheque
        regalo.
        <br />
        Si el artículo no estaba marcado como regalo en el momento de la compra,
        o si la persona que hizo el regalo se envió a sí misma el pedido para
        entregártelo a ti más tarde, enviaremos un reembolso a la persona que
        hizo el regalo y ésta se enterará de tu devolución.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Envío
      </Heading>
      <Text mb={4}>
        Para devolver su producto, debe enviarlo por correo a: Fliederweg 4A
        85391, Allershausen. Alemania. Usted será responsable de pagar sus
        propios gastos de envío para devolver su artículo. Los gastos de envío
        no son reembolsables. Si recibe un reembolso, el coste del envío de
        devolución se deducirá de su reembolso.
        <br />
        Dependiendo de dónde viva, el tiempo que puede tardar en llegarle el
        producto cambiado puede variar.
        <br />
        Si va a enviar un artículo de más de 75 $, debería considerar el uso de
        un servicio de envío con seguimiento o la compra de un seguro de envío.
        No garantizamos que recibamos el artículo devuelto.
      </Text>
    </Box>
  );
};

export default PoliticaDeReembolso;