import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

const PoliticaDeEnvio: React.FC = () => {
  return (
    <Box p={4} maxW="960px" mx="auto">
      <Heading as="h1" mb={4}>
        Política de Envío
      </Heading>

      <Text mb={4}>
        Valoramos su decisión y queremos asegurarnos de que tenga una experiencia
        fluida y transparente a la hora de enviar sus preciados artículos. Por
        favor, tómese un momento para revisar nuestra Política de envío a
        continuación.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Información general sobre envíos
      </Heading>
      <Text mb={4}>
        Hacemos todo lo posible para procesar y enviar los pedidos lo más rápido
        posible. Una vez confirmado su pedido y recibido el pago, nuestro equipo
        comenzará a preparar su obra de arte para el envío. Tenga en cuenta que
        todos los plazos de envío que se mencionan a continuación son aproximados
        y pueden variar debido a factores que escapan a nuestro control, como
        retrasos en aduanas o circunstancias imprevistas.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Plazos de envío
      </Heading>
      <Text mb={4}>
        <strong>1. Obras de arte al óleo sobre lienzo:</strong>  
        Para los clientes de fuera de Europa que hayan adquirido obra pictórica:
        «óleo sobre lienzo» o «oleo sobre madera», el plazo de envío es de
        aproximadamente 4 semanas. Aseguramos un embalaje rígido hecho a medida
        que garantiza el transporte seguro de su obra de arte. Este cuidado y
        atención adicionales al embalaje pueden contribuir a que el plazo de
        envío sea ligeramente superior. Tenga la seguridad de que priorizamos
        la seguridad e integridad de su compra durante el tránsito.
      </Text>
      <Text mb={4}>
        <strong>2. Dibujos y artículos similares:</strong>  
        Para los clientes de fuera de Europa que hayan comprado dibujos y
        artículos similares, prevea un plazo de envío de unas 2 semanas. Aunque
        nos esforzamos por tratar estos artículos con el mismo cuidado, los
        requisitos de embalaje suelen ser menos complejos que los de las obras de
        arte al óleo sobre lienzo. Por lo tanto, el proceso de envío de estos
        artículos suele llevar menos tiempo.
      </Text>
      <Text mb={4}>
        <strong>3. Envío dentro de Europa:</strong>  
        Los clientes dentro de Europa pueden esperar que sus pedidos lleguen
        aproximadamente 1 semana antes de los plazos de envío estimados
        mencionados anteriormente. Esto significa que para las obras de arte
        pictórico «óleo sobre lienzo / sobre madera», el envío puede tardar unas
        3 semanas, mientras que los dibujos y artículos similares pueden llegar
        en aproximadamente 1 semana.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Seguimiento del pedido
      </Heading>
      <Text mb={4}>
        Una vez enviado su pedido, recibirá un correo electrónico de confirmación
        con un número de seguimiento e instrucciones sobre cómo realizar el
        seguimiento del paquete. Esto le permitirá mantenerse informado sobre el
        paradero de su obra de arte durante todo el proceso de envío.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Métodos de envío
      </Heading>
      <Text mb={4}>
        Utilizamos transportistas fiables y reputados para garantizar la entrega
        segura y puntual de sus obras de arte. El método de envío específico para
        su pedido se determinará en función de factores como su ubicación, el
        tamaño y el peso de los artículos y la disponibilidad del servicio de
        envío.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Aduanas y aranceles internacionales
      </Heading>
      <Text mb={4}>
        Tenga en cuenta que los pedidos internacionales pueden estar sujetos a
        derechos de aduana, impuestos y tasas impuestos por el país de destino.
        Estos cargos adicionales son responsabilidad del cliente y pueden variar
        en función de la normativa aduanera específica de su país. Le recomendamos
        que se familiarice con las políticas aduaneras aplicables a su ubicación
        para evitar costes o retrasos inesperados.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        Consolidación de pedidos
      </Heading>
      <Text mb={4}>
        Si ha realizado varios pedidos en un breve espacio de tiempo, haremos
        todo lo posible por consolidarlos y enviarlos juntos siempre que sea
        posible. Esto ayuda a optimizar el proceso de envío y minimizar cualquier
        posible retraso o inconveniente.
      </Text>

      <Text mb={4}>
        Agradecemos su comprensión y cooperación con nuestra política de envíos.
        Si tiene alguna pregunta o duda sobre el envío, no dude en ponerse en
        contacto con nuestro equipo de atención al cliente. Estamos aquí para
        ayudarle y asegurarnos de que su obra de arte llegue en perfectas
        condiciones y a tiempo.
      </Text>

      <Text mb={4}>
        Nota: Esta política de envíos está sujeta a cambios sin previo aviso.
        Consulte la última versión disponible en nuestro sitio web para obtener
        la información más actualizada.
      </Text>
    </Box>
  );
};

export default PoliticaDeEnvio;