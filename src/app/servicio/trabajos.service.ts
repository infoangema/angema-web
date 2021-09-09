import {Injectable} from '@angular/core';

@Injectable()

export class TrabajosService {

  private heroes: Heroe[] = [

    {
      nombre: 'Lucha contra el cancer, Carrefour',
      bio: 'Se realizó una multi campaña conmemorando el dia internacional de la lucha contra el cancer. Fué una serie de piezas entre ellas publicidad para el Facebook, Instagram y Emailing.',
      img: 'assets/img/face-carrefour.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Cartel informativa Garantía Activa, Carrefour',
      bio: 'En los puestos de ventas de electrodomésticos de Carrefour se empleó esta afiche informativo con intención de que contraten la Garantía Extendida.',
      img: 'assets/img/carrefour-carteleria.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Banner Facebook Tecnología Pritegida, Carrefour',
      bio: 'Con los productos que ofrece Carrefour, se implementan campañas masivas por medio de Facebook, Google Ads, Instagram, Mailings, etc.',
      img: 'assets/img/carrefour-banner1.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Banner Google Hogar Pritegido, Carrefour',
      bio: 'Con los productos que ofrece Carrefour, se implementan campañas masivas por medio de Facebook, Google Ads, Instagram, Mailings, etc.',
      img: 'assets/img/carrefour-banner2.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Gif animado, Carrefour',
      bio: 'Con los productos que ofrece Carrefour, se implementan campañas masivas por medio de Facebook, Google Ads, Instagram, Mailings, etc.',
      img: 'assets/img/gif-carrefour.gif',
      casa: 'Carrefour'
    },

    {
      nombre: 'Cartel informativa Robo portable, Carrefour',
      bio: 'En los puestos de ventas de electrodomésticos de Carrefour se empleó esta afiche informativo con intención de que contraten el seguro de Robo portable.',
      img: 'assets/img/carrefour-carteleria2.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Cartas legales, Carrefour',
      bio: 'Cuando se ajusta unas de las póliza del seguro modificando su valor o cambiando algunos de los puntos de la cobertura, se manda de forma masiva las cartas para informar a sus usuarios de las nuevas modificaciones.',
      img: 'assets/img/carrefour-cartas.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Tríptico, Carrefour',
      bio: 'En los puntos de ventas se entregaba de forma informativa a los clientes las distintas coberturas que ofrece Carrefour Servicios.',
      img: 'assets/img/carrefour-triptico.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Pieza Digital, Carrefour',
      bio: 'Como estrategia comercial, el equipo de Marketing de Carrefour se les ocurrió hacer una pieza gráfica para alentar la protección de los útiles escolares y las pertenencias de los alumnos en el primer día de clases.',
      img: 'assets/img/carrefour-mailing.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Email, Carrefour',
      bio: 'De forma masiva se envia a los contactos de Carrefour alguna pieza informativa, en este caso para contar sobre una de sus coberturas.',
      img: 'assets/img/carrefour-email.jpg',
      casa: 'Carrefour'
    },

    {
      nombre: 'Pieza Gráfica, Cordial',
      bio: 'Saca a la venta un nuevo seguro, en este caso, de mascotas.',
      img: 'assets/img/cordial-grafica.jpg',
      casa: 'Cordial'
    },

    {
      nombre: 'Email, Direct Tv',
      bio: '',
      img: 'assets/img/directv-email.jpg',
      casa: 'Cordial'
    },

    {
      nombre: 'Email, Direct Tv',
      bio: '',
      img: 'assets/img/directv-email2.jpg',
      casa: 'Direct Tv'
    },

    {
      nombre: 'Grafica, Efectivo Si',
      bio: 'En tiempos de cuarentena, Efectivo Si se percató que los usuarios no se daban cuenta que tienen beneficios activos. Se desarrolló esta pieza para hacerles acordar que siguen protegidos.',
      img: 'assets/img/efectivoSi-grafica.jpg',
      casa: 'Efectivo Si'
    },

    {
      nombre: 'Email, Falabella',
      bio: '',
      img: 'assets/img/falabella-email.jpg',
      casa: 'Falabella'
    },

    {
      nombre: 'Infografía, Musimundo',
      bio: 'Los usuarios de Musimundo estaban teniendo problemas a la hora de cargar datos en la página. Se diseño una infografía para ayudarlos a entender el proceso.',
      img: 'assets/img/musimundo-infografia.jpg',
      casa: 'Musimundo'
    },

    {
      nombre: 'Gif Pagina Web, Musimundo',
      bio: '',
      img: 'assets/img/musimundo-gif.gif',
      casa: 'Musimundo'
    },

    {
      nombre: 'Whats App Publicidad, Musimundo',
      bio: 'Publicidad dirigida por Whats App .',
      img: 'assets/img/musimundo-whats1.jpg',
      casa: 'Musimundo'
    },

    {
      nombre: 'Whats App Publicidad, Musimundo',
      bio: 'Publicidad dirigida por Whats App .',
      img: 'assets/img/musimundo-whats2.jpg',
      casa: 'Musimundo'
    },

    {
      nombre: 'Tarjeta, Musimundo',
      bio: 'Se desarrolló una tarjeta para los nuevos clientes de musimundo. Al adquirir cualquier producto y tener activa su cobertura, se le imprime en dicha tarjeta el código QR para que tengan un acceso más rápido a la hora de usarla.',
      img: 'assets/img/musimundo-tarjeta.jpg',
      casa: 'Musimundo'
    },

    {
      nombre: 'Web, Naldo',
      bio: 'Dentro de la página web de Naldo, se abrió una sección ofreciendo los distintos seguros que ofrece. Se realizó el maquetado y el desarrollo del mismo.',
      img: 'assets/img/naldo-web.jpg',
      casa: 'Naldo'
    },

    {
      nombre: 'Gráfica, Naldo',
      bio: '',
      img: 'assets/img/naldo-grafica.jpg',
      casa: 'Naldo'
    },

    {
      nombre: 'Mailing, Psa',
      bio: 'Email masivo de la empresa PSA para informar a sus usuarios de las coberturas que tienen vigente.',
      img: 'assets/img/psa-email.png',
      casa: 'Naldo'
    },

    {
      nombre: 'Gráfica, Cardif',
      bio: '',
      img: 'assets/img/cardif-hogar.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Logotipo, Cardif',
      bio: 'Logotipo para uno de los proyectos de la empresa.',
      img: 'assets/img/cardif-logo.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Grafica Evento interno, Cardif',
      bio: 'Todos los años se realiza a nivel nacional un evento en donde se refleja la evolución de los equipos internos a la empresa. Se realiza una pieza gráfica para recordarle a los empleados el cronograma, día y horarios',
      img: 'assets/img/cardif-evento.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Grafica Evento interno, Cardif',
      bio: 'Tarjeta de agradecimiento interno a la empresa con código QR para la valoración del evento.',
      img: 'assets/img/cardif-evento2.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Infografía, Cardif',
      bio: '',
      img: 'assets/img/cardif-infografia.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Infografía, Cardif',
      bio: '',
      img: 'assets/img/cardif-infografia2.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Invitación interna, Cardif',
      bio: 'Piezas gráficas para saludos internos de la empresa.',
      img: 'assets/img/cardif-evento3.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Invitación, Cardif',
      bio: 'Piezas gráficas para saludos internos de la empresa.',
      img: 'assets/img/cardif-invitacion.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Tarjeta Saludos, Cardif',
      bio: 'Piezas gráficas para saludos internos de la empresa.',
      img: 'assets/img/cardif-saludo.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Tarjeta Saludos, Cardif',
      bio: 'Piezas gráficas para saludos internos de la empresa.',
      img: 'assets/img/cardif-saludo2.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Tarjeta Saludos, Cardif',
      bio: 'Piezas gráficas para saludos internos de la empresa.',
      img: 'assets/img/cardif-saludo3.jpg',
      casa: 'Cardif'
    },

    {
      nombre: 'Tarjeta, Citroen',
      bio: 'Tarjeta para la empresa PSA con una de sus marcas Citroen.',
      img: 'assets/img/citroen-tarjeta.jpg',
      casa: 'Citroen'
    },

    {
      nombre: 'Tarjeta, Peugeot',
      bio: 'Tarjeta para la empresa PSA con una de sus marcas Peugeot.',
      img: 'assets/img/peugeot-tarjeta.jpg',
      casa: 'Peugeot'
    },

    {
      nombre: 'Tarjeta, Ds',
      bio: 'Tarjeta para la empresa PSA con una de sus marcas DS.',
      img: 'assets/img/ds-tarjeta.jpg',
      casa: 'Ds'
    },

    {
      nombre: 'Logotipo, Facultad Uba',
      bio: 'Trabajo realizado en la Facultad de Buenos Aires (UBA).',
      img: 'assets/img/facultad-logo.jpg',
      casa: 'Uba'
    },

    {
      nombre: 'Identidad, Facultad Uba',
      bio: 'Trabajo realizado en la Facultad de Buenos Aires (UBA) desarrollando la identidad de un tema de rock nacional, realizando tapa y contra tapa del disco de vinilo, entradas y disco.',
      img: 'assets/img/facultad-identidad.jpg',
      casa: 'Uba'
    },

    {
      nombre: 'Infografía, Facultad Uba',
      bio: 'Trabajo realizado en la Facultad de Buenos Aires (UBA) desarrollando una infografía contando las problemáticas de la minería en Argentina.',
      img: 'assets/img/facultad-infografia.jpg',
      casa: 'Uba'
    },

    {
      nombre: 'Diseño Industrial, Facultad Uba',
      bio: 'Trabajo realizado en la Facultad de Buenos Aires (UBA) desarrollando un re diseño de un microondas de la marca Samsung.',
      img: 'assets/img/facultad-diseñoIndustrial.jpg',
      casa: 'Uba'
    },

    {
      nombre: 'Logotipo, Angema',
      bio: 'Diseño de marca de la empresa tecnológica Angema. Se buscó dar un enfoque cromático fuera de lo genérico relacionado a la tecnología (el azul y sus gamas) poniéndole una identidad distintiva ante sus competidores. ',
      img: 'assets/img/angema-logotipo.jpg',
      casa: 'Angema'
    },

    {
      nombre: 'Packaging, Nikitos',
      bio: 'Paquetes re diseñados. La marca se empezó a renovar dándole un nuevo enfoque a sus productos y renobando su imagen.',
      img: 'assets/img/nikitos-packaging.jpg',
      casa: 'Nikitos'
    },

    {
      nombre: 'Packaging, Nikitos',
      bio: 'Paquetes re diseñados. La marca se empezó a renovar dándole un nuevo enfoque a sus productos y renobando su imagen.',
      img: 'assets/img/nikitos-packaging2.jpg',
      casa: 'Nikitos'
    },

    {
      nombre: 'Packaging, Nikitos',
      bio: 'Paquetes re diseñados. La marca se empezó a renovar dándole un nuevo enfoque a sus productos y renobando su imagen.',
      img: 'assets/img/nikitos-packaging3.jpg',
      casa: 'Nikitos'
    },

    {
      nombre: 'Logotipo, Ardeco',
      bio: '',
      img: 'assets/img/ardeco-logo.jpg',
      casa: 'Ardeco'
    }
  ];

  constructor() {
    console.log('Servicio listo para usar');
  }

  public getHeroes() {
    return this.heroes;
  }

  getHeroe(i: string) {
    return this.heroes[i];
  }

  buscarHeroes(termino: string) {
    const heroesArr: Heroe[] = [];
    termino = termino.toLowerCase();

    for (let i = 0; i < this.heroes.length; i++) {
      const heroe = this.heroes[i];
      const nombre = heroe.nombre.toLowerCase();
      if (nombre.indexOf(termino) >= 0) {
        heroe.idx = i;
        heroesArr.push(heroe);
      }
    }
    return heroesArr;
  }
}

export interface Heroe {

  nombre: string;
  bio: string;
  img: string;
  casa: string;
  idx?: number;
}

