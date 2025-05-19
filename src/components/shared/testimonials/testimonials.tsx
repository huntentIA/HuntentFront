import React from 'react'
import styles from '../testimonials/styles/testimonials.module.css'
import { Testimonial } from './interfaces/testimonials'

const testimonials: Testimonial[] = [
  {
    name: 'Juan Pérez',
    role: 'Desarrollador Frontend',
    message: 'Este servicio ha cambiado mi vida profesional. 100% recomendado.',
    image: '/assets/juan.jpg',
  },
  {
    name: 'María Gómez',
    role: 'Diseñadora UX',
    message:
      'Increíble experiencia, el soporte es excelente y la calidad insuperable.',
    image: '/assets/maria.jpg',
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Project Manager',
    message:
      'La mejor inversión que he hecho en mi carrera. Un producto excepcional.',
    image: '/assets/carlos.jpg',
  },
]

// Función para obtener las iniciales de un nombre
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const Testimonials: React.FC = () => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Testimonios</h2>
      <div className={styles.grid}>
        {testimonials.map((testimonial, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.avatarContainer}>
              {testimonial.image ? (
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className={styles.image}
                  onError={(e) => {
                    // Cuando hay error en la carga de la imagen, oculta la imagen
                    (e.target as HTMLImageElement).style.display = 'none';
                    // Muestra el contenedor de iniciales
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const initialsEl = parent.querySelector(`.${styles.initials}`);
                      if (initialsEl) {
                        (initialsEl as HTMLElement).style.display = 'flex';
                      }
                    }
                  }}
                />
              ) : null}
              <div 
                className={styles.initials} 
                style={{ display: testimonial.image ? 'none' : 'flex' }}
              >
                {getInitials(testimonial.name)}
              </div>
            </div>
            <p className={styles.message}>"{testimonial.message}"</p>
            <h3 className={styles.name}>{testimonial.name}</h3>
            <span className={styles.role}>{testimonial.role}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Testimonials
