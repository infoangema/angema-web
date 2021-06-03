import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

  public load: Boolean = false;
  constructor() { }

  ngOnInit(): void {
    setTimeout(() =>{
      this.load = true;

  }, 130000);
}
}