import React from "react";

const MapaUbicacion = () => {
  return (
    <div className="flex items-center justify-center">
      <iframe
        src="https://www.google.com/maps/embed?pb=!4v1765262100087!6m8!1m7!1s-KgclLBWi48tK3TfocobUw!2m2!1d19.95523148177638!2d-99.5310024683493!3f356.5913052145904!4f22.225026986943973!5f0.4856615363196059"
        width="600"
        height="450"
        loading="lazy"
      ></iframe>
    </div>
  );
};

export default MapaUbicacion;
