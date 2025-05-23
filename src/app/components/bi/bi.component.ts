import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotonesBiComponent } from '../botones-bi/botones-bi.component';
import { TextoMovilComponent } from '../recursos/texto-movil/texto-movil.component';
import { SecuenciaComponent } from '../recursos/secuencia/secuencia.component';
import { BannerCentralComponent } from '../../banner-central/banner-central.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-bi',
  standalone: true,
  imports: [
    CommonModule,
    BotonesBiComponent,
    TextoMovilComponent,
    SecuenciaComponent,
    BannerCentralComponent,
    FooterComponent
  ],
  templateUrl: './bi.component.html',
})
export class BiComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
