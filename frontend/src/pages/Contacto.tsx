import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";

const Contacto: React.FC = () => {
  return (
    <Box p={4} maxW="960px" mx="auto">
      <Heading as="h1" mb={4}>
        Información de contacto
      </Heading>

      <Text mb={4}>
        Valoramos sus comentarios, preguntas e inquietudes. Si necesita ponerse en
        contacto con nosotros, utilice la siguiente información de contacto:
      </Text>

      <Text mb={4}>
        <strong>Método preferido:</strong> Le animamos a que se ponga en contacto
        con nosotros a través del correo electrónico{" "}
        <strong>gestionartech+support@gmail.com</strong>. Nuestro equipo de
        atención al cliente responderá rápidamente a sus mensajes y le
        proporcionará la asistencia que necesite.
      </Text>

      <Text mb={4}>
        Además, también puede utilizar la función de enlaces con distintas
        plataformas en nuestro sitio web. Simplemente visite nuestro sitio web y
        busque el icono o widget, normalmente situado en la esquina inferior de la
        pantalla. Nuestro equipo de asistencia por chat estará disponible durante
        el horario laboral especificado para atender sus consultas y proporcionarle
        ayuda en tiempo real.
      </Text>

      <Text mb={4}>
        Nos esforzamos por ofrecer un servicio de atención al cliente excepcional
        y nos comprometemos a resolver sus dudas de forma oportuna y satisfactoria.
        No dude en ponerse en contacto con nosotros si tiene alguna pregunta,
        comentario o problema. Estaremos encantados de ayudarle.
      </Text>

      <Text mb={4}>
        Tenga en cuenta que nuestra información de contacto está sujeta a cambios.
        Para obtener los datos de contacto más actualizados, le recomendamos que
        visite nuestro sitio web o consulte cualquier comunicación actualizada que
        le hayamos enviado.
      </Text>
    </Box>
  );
};

export default Contacto;