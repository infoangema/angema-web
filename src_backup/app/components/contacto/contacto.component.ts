import {Component, OnInit} from '@angular/core';
import {ContactoModel} from '../../models/contacto.model';
import {ContactoService} from '../../servicio/contacto.service';
import {NgForm} from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styles: []
})
export class ContactoComponent implements OnInit {

  contacto = new ContactoModel();

  constructor(private contactoService: ContactoService) {
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
    this.contactoService.crearConsulta(this.contacto)
      .subscribe(resp => {
        console.log(resp);
        this.contacto = resp;
      });
    this.resetearContacto();
  }
}
