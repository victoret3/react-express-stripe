import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

const AvisoLegal: React.FC = () => {
  return (
    <Box p={4} maxW="960px" mx="auto">
      <Heading as="h1" mb={4}>
        Aviso Legal
      </Heading>

      <Text mb={4}>
        Con el fin de garantizar el cumplimiento de las leyes y normativas
        aplicables, le rogamos revise el siguiente aviso legal relativo a las
        obras de arte vendidas desde España.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        1. Procedencia de las obras
      </Heading>
      <Text mb={4}>
        Todas las obras de arte disponibles para su compra en nuestro sitio web
        proceden y se venden desde Alemania y desde España, a menos que se indique
        explícitamente lo contrario.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        2. Código armonizado
      </Heading>
      <Text mb={4}>
        El código armonizado de las obras de arte vendidas desde España es
        97019100. Este código se utiliza a efectos aduaneros para clasificar e
        identificar el tipo específico de obra de arte que se envía
        internacionalmente. Tenga en cuenta que este código armonizado puede
        variar en función de la obra de arte concreta y sus características.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        3. Derechos e impuestos de importación
      </Heading>
      <Text mb={4}>
        Al realizar un pedido de una obra de arte desde Alemania, los clientes de
        fuera de Alemania pueden estar sujetos a derechos de importación, impuestos
        y tasas impuestos por el país de destino. Estos cargos adicionales son
        responsabilidad del cliente y pueden variar en función de las normativas y
        políticas aduaneras del país de destino. Le recomendamos que se familiarice
        con las leyes y reglamentos de importación de su país para entender y
        anticipar cualquier coste potencial asociado con la importación de obras
        de arte.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        4. Autenticidad y exactitud de la descripción
      </Heading>
      <Text mb={4}>
        Nos esforzamos por ofrecer información precisa y detallada sobre las obras
        de arte que aparecen en nuestro sitio web. Hacemos todo lo posible para
        garantizar que las descripciones, imágenes, dimensiones y otros detalles
        relevantes representen fielmente la obra de arte. Sin embargo, tenga en
        cuenta que los colores pueden variar ligeramente debido a la configuración
        del monitor y a la naturaleza de la representación artística. Si tiene
        alguna pregunta o duda sobre la autenticidad o exactitud de una obra de
        arte, póngase en contacto con nuestro equipo de atención al cliente para
        obtener aclaraciones antes de realizar una compra.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        5. Derechos de autor y propiedad intelectual
      </Heading>
      <Text mb={4}>
        Todas las obras de arte vendidas en nuestro sitio web están protegidas por
        las leyes de derechos de autor y propiedad intelectual. Los derechos de
        autor de las obras pertenecen a sus respectivos artistas. Está estrictamente
        prohibido reproducir, distribuir o utilizar cualquier obra de arte
        comprada en nuestro sitio web con fines comerciales sin obtener el permiso
        explícito del titular de los derechos de autor.
      </Text>

      <Heading as="h2" size="md" mb={3}>
        6. Limitación de responsabilidad
      </Heading>
      <Text mb={4}>
        Aunque nos esforzamos por proporcionar información precisa y garantizar la
        calidad de las obras de arte, no nos hacemos responsables de ningún daño
        directo o indirecto, incluidos, entre otros, los perjuicios económicos,
        derivados de la compra, el uso o la exhibición de las obras de arte. El
        cliente reconoce que el aspecto de las obras de arte puede variar
        ligeramente con respecto a las imágenes mostradas en nuestro sitio web
        debido a la naturaleza de la creación artística y a la singularidad de cada
        pieza.
      </Text>

      <Text mb={4}>
        Al acceder a nuestro sitio web, realizar una compra o utilizar nuestros
        servicios, usted acepta cumplir los términos y condiciones expuestos en el
        presente aviso legal.
      </Text>

      <Text mb={4}>
        Tenga en cuenta que este aviso legal está sujeto a cambios sin previo
        aviso. Le recomendamos que consulte la versión más reciente disponible en
        nuestro sitio web o que se ponga en contacto con nuestro equipo de atención
        al cliente para cualquier actualización o aclaración.
      </Text>

      <Text mb={4}>
        Si tiene alguna pregunta o necesita más ayuda en relación con este aviso
        legal o cualquier otro asunto, no dude en ponerse en contacto con nosotros
        por correo electrónico en @gmail.com o a través de la función de chat
        disponible en nuestro sitio web.
      </Text>

      <Text mb={4}>
        Gracias por su comprensión y colaboración.
      </Text>

      <Text mb={4}>
        Gestion Art Technology S.L. B09802554<br />
        Camino de los Palacios, 12, 41500, Alcalá de Guadaira, Sevilla, España<br />
        tienda.antoniogarciavillaran.es
      </Text>
    </Box>
  );
};

export default AvisoLegal;