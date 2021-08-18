import { Component, OnInit } from '@angular/core';
import { ContactoModel } from 'src/app/models/contacto.model';
import { NgForm } from '@angular/forms';
import { ContactoService } from 'src/app/servicio/contacto.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contacto-home',
  templateUrl: './contacto-home.component.html',
  styles: [
  ]
})
export class ContactoHomeComponent implements OnInit {

  contacto = new ContactoModel();

  constructor( private contactoService: ContactoService) { }

  ngOnInit(): void {
  }

  guardar (form : NgForm){
   if ( form.invalid){
    Swal.fire({
      title: 'Faltan datos',
      text: 'por favor, completar todo el formulario',
      icon: 'error',
      allowOutsideClick: true,
    });     return;
   }

  Swal.fire({
    title: 'Su mensaje',
    text: 'se envió correctamente',
    icon: 'success',
    allowOutsideClick: true,
  });


   this.contactoService.crearConsulta(this.contacto)
   .subscribe( resp => {
    console.log(resp);
    this.contacto = resp;
   } );
   this.contacto.name="";
   this.contacto.mail="";
   this.contacto.company="";
   this.contacto.description="";
   this.contacto.phone="";


}
}
