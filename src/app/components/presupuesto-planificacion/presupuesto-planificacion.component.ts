import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-presupuesto-planificacion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './presupuesto-planificacion.component.html',
  styleUrls: ['./presupuesto-planificacion.component.css']
})
export class PresupuestoPlanificacionComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Agregar scroll suave a todos los enlaces del índice
    this.setupSmoothScrolling();
  }

  volverAPresupuestos(): void {
    console.log('Navegando de vuelta a presupuestos...');
    this.router.navigate(['/presupuestos']);
  }

  private setupSmoothScrolling(): void {
    // Esperar a que el DOM esté completamente cargado
    setTimeout(() => {
      const navLinks = document.querySelectorAll('.sidebar .nav-link');
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
              this.scrollToElement(targetElement);
              this.updateActiveLink(link);
            }
          }
        });
      });

      // Agregar listener para actualizar el enlace activo al hacer scroll
      window.addEventListener('scroll', () => {
        this.updateActiveNavOnScroll();
      });
    }, 100);
  }

  private scrollToElement(element: Element): void {
    const headerOffset = 100; // Offset para el header sticky
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  private updateActiveLink(activeLink: Element): void {
    // Remover clase activa de todos los enlaces
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Agregar clase activa al enlace clickeado
    activeLink.classList.add('active');
  }

  private updateActiveNavOnScroll(): void {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const sectionHeight = (section as HTMLElement).offsetHeight;
      
      if (sectionTop <= 150 && sectionTop + sectionHeight > 150) {
        currentSection = section.getAttribute('id') || '';
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
} 