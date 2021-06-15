import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'spa';
  verificarSpinner : string ='';


constructor(){

  this.verificarSpinner = JSON.parse ( localStorage.getItem('data'));

}

  ngOnInit(): void {

    localStorage.setItem('data', JSON.stringify (this.verificarSpinner))

      if( this.verificarSpinner === '' || this.verificarSpinner == null ){
      setTimeout(() =>{
        this.verificarSpinner = 'false';
        this.guardarStorage();
   
     }, 5000);
   }
   }

  guardarStorage(){
    localStorage.setItem('data', JSON.stringify (this.verificarSpinner))
   }

   cargarStorage(){
     
     this.verificarSpinner = JSON.parse ( localStorage.getItem('data'));
    
                  }

}
