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
     console.log('Formulario no válido');
     return;
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
   this.contacto.nombre="";
   this.contacto.email="";
   this.contacto.empresa="";
   this.contacto.mensaje="";
   this.contacto.telefono=0;


}
}
