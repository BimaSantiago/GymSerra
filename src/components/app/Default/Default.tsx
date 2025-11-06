import Menu from "@/components/menu/Menu";
import Nosotros from "@/components/secciones/Nosotros";
import Principal from "@/components/secciones/Principal";
import Footer from "@/components/secciones/footer/Footer";
import Noticias from "@/components/secciones/Noticias";

const Default = () => {
  return (
    <div>
      <Menu />
      <Principal />
      <Nosotros />
      <Noticias></Noticias>
      <Footer />
    </div>
  );
};

export default Default;
