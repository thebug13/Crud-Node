import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit, OnDestroy {
  categorias: Categoria[] = [];
  categoria: Categoria = { id: 0, nombre: '' };
  isEditMode = false;
  selectedCategoryId: number | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isAdmin: boolean = false;
  searchText: string = '';
  filteredCategorias: Categoria[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.isAdmin = this.authService.getUserRole() === 'Administrador';
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.apiService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.filteredCategorias = [...this.categorias];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar categorías:', error);
        this.errorMessage = 'Error al cargar categorías.';
        this.isLoading = false;
        if (error.status === 401) {
          this.authService.removeToken();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  onEdit(categoria: Categoria): void {
    this.isEditMode = true;
    this.selectedCategoryId = categoria.id;
    this.categoria = { ...categoria };
    this.errorMessage = null;
    this.successMessage = null;
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.isEditMode) {
      this.apiService.updateCategoria(this.categoria.id, this.categoria).subscribe({
        next: () => {
          this.successMessage = 'Categoría actualizada correctamente';
          this.resetForm();
          this.loadCategorias();
        },
        error: (error: any) => {
          console.error('Error al actualizar categoría:', error);
          this.errorMessage = 'Error al actualizar categoría.';
          this.isLoading = false;
          if (error.status === 401) {
            this.authService.removeToken();
            this.router.navigate(['/login']);
          }
        }
      });
    } else {
      this.apiService.createCategoria(this.categoria).subscribe({
        next: () => {
          this.successMessage = 'Categoría creada correctamente';
          this.resetForm();
          this.loadCategorias();
        },
        error: (error: any) => {
          console.error('Error al crear categoría:', error);
          this.errorMessage = 'Error al crear categoría.';
          this.isLoading = false;
          if (error.status === 401) {
            this.authService.removeToken();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  onDelete(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;
      this.apiService.deleteCategoria(id).subscribe({
        next: () => {
          this.successMessage = 'Categoría eliminada correctamente';
          this.loadCategorias();
        },
        error: (error: any) => {
          console.error('Error al eliminar categoría:', error);
          this.errorMessage = 'Error al eliminar categoría.';
          this.isLoading = false;
          if (error.status === 401) {
            this.authService.removeToken();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedCategoryId = null;
    this.categoria = { id: 0, nombre: '' };
    this.isLoading = false;
    // Los mensajes de éxito/error se limpian al enviar o cargar.
  }

  filterCategories(): void {
    if (!this.searchText) {
      this.filteredCategorias = [...this.categorias];
      return;
    }

    const lowerCaseSearchText = this.searchText.toLowerCase();
    this.filteredCategorias = this.categorias.filter(categoria =>
      categoria.nombre.toLowerCase().includes(lowerCaseSearchText)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 