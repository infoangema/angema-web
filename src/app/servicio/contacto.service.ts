
import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { ContactoModel} from '../models/contacto.model';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class ContactoService {

  private url = 'https://angema-hours-backend.herokuapp.com';

  constructor( private http: HttpClient) { }

  crearConsulta ( consulta : ContactoModel){

     return this.http.post( `${this.url}/contacts`, consulta ).pipe(
       map( (resp:any) => {
            consulta.id= resp.name;
            return consulta;
     
     })
     );
  }

  // export class ContactoService {

  //    private url = 'https://contactoangema-default-rtdb.firebaseio.com';
  
  //   constructor( private http: HttpClient) { }
  
  //   crearConsulta ( consulta : ContactoModel){
  
  //      return this.http.post( `${this.url}/contacto.json`, consulta ).pipe(
  //        map( (resp:any) => {
  //             consulta.id= resp.name;
  //             return consulta;
       
  //      })
  //      );
  //   }



}
