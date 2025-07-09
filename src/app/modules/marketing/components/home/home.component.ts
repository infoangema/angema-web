import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { BotonesComponent } from '../../../../shared/components/botones/botones.component';
import { ContactoComponent } from '../../../../shared/components/contacto/contacto.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    BotonesComponent,
    ContactoComponent,
    FooterComponent
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }
}
