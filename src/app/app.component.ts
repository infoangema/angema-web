import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SpinnerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'angema-web';
  verificarSpinner: string = '';

  constructor() {
    const storedData = localStorage.getItem('data');
    this.verificarSpinner = storedData ? JSON.parse(storedData) : '';
  }

  ngOnInit(): void {
    localStorage.setItem('data', JSON.stringify(this.verificarSpinner));

    if (this.verificarSpinner === '' || this.verificarSpinner == null) {
      setTimeout(() => {
        this.verificarSpinner = 'false';
        this.guardarStorage();
      }, 5000);
    }
  }

  guardarStorage() {
    localStorage.setItem('data', JSON.stringify(this.verificarSpinner));
  }

  cargarStorage() {
    const storedData = localStorage.getItem('data');
    this.verificarSpinner = storedData ? JSON.parse(storedData) : '';
  }
}
