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

const Testimonials: React.FC = () => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>Testimonios</h2>
      <div className={styles.grid}>
        {testimonials.map((testimonial, index) => (
          <div key={index} className={styles.card}>
            <img
              src={testimonial.image}
              alt={testimonial.name}
              className={styles.image}
            />
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
