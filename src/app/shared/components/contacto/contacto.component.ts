import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContactoModel } from '../../../core/models/contacto.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contacto.component.html',
  styles: []
})
export class ContactoComponent implements OnInit {

  contacto = new ContactoModel();

  constructor() {
  }

  ngOnInit(): void {
    this.resetearContacto();
  }

  resetearContacto() {
    this.contacto.id = '';
    this.contacto.name = '';
    this.contacto.company = '';
    this.contacto.phone = '';
    this.contacto.mail = '';
    this.contacto.description = '';
  }

  guardar(form: NgForm) {
    console.log(this.contacto.name);
    if (form.invalid || this.contacto.name === '' || this.contacto.company === '' || this.contacto.phone === ''
      || this.contacto.mail === '' || this.contacto.description === '') {
      Swal.fire({
        title: 'Error de datos',
        text: 'por favor, completar todo el formulario',
        icon: 'error',
        allowOutsideClick: true,
      });
      return;
    }

    Swal.fire({
      title: 'Su mensaje',
      text: 'se envió correctamente',
      icon: 'success',
      allowOutsideClick: true,
    });
    this.resetearContacto();
  }
}
