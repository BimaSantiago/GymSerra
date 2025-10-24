import Menu from "@/components/menu/Menu";
import Nosotros from "@/components/secciones/Nosotros";
import Principal from "@/components/secciones/Principal";
import Footer from "@/components/secciones/footer/Footer";
import Noticias from "@/components/secciones/Noticias";
import Comentarios from "@/components/secciones/Comentarios";

const Default = () => {
  return (
    <div>
      <Menu />
      <Principal />
      <Nosotros />
      <Noticias></Noticias>
      <Comentarios></Comentarios>
      <Footer />
    </div>
  );
};

export default Default;
