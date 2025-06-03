import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TutorialProps {
  isDarkMode: boolean;
  onOpenSidebar?: () => void;
  shouldStart?: boolean;
  onEnd?: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ isDarkMode, onOpenSidebar, shouldStart = false, onEnd }) => {
  const [steps] = useState<Step[]>([
   /*  {
      target: '.sidebar',
      content: 'Bienvenido a Huntent! Aquí encontrarás todas las herramientas principales de la aplicación.',
      placement: 'right',
      disableBeacon: true,
    }, */
    {
      target: 'a[href="/knowledgeBaseView"]',
      content: 'Base de Conocimiento: Aquí puedes gestionar y acceder a toda la información importante de tu negocio.',
      placement: 'right',
    },
    {
      target: 'a[href="/referentSearch"]',
      content: 'Cazador de Referentes: Encuentra y analiza referentes relevantes para tu negocio.',
      placement: 'right',
    },
    {
      target: 'a[href="/userAccount"]',
      content: 'Directorio de Referentes: Gestiona y organiza tus referentes favoritos.',
      placement: 'right',
    },
    {
      target: 'a[href="/contentPlanner"]',
      content: 'Cazador de Contenido: Planifica y organiza tu contenido de manera eficiente.',
      placement: 'right',
    },
    {
      target: 'a[href="/approveContentPlanner"]',
      content: 'Publicaciones Aprobadas: Revisa y gestiona el contenido que has aprobado.',
      placement: 'right',
    },
    {
      target: 'button[aria-label="Cambiar tema"]',
      content: 'Cambia entre el modo claro y oscuro según tus preferencias.',
      placement: 'bottom',
    },
  ]);

  const [run, setRun] = useState(false);

  // Efecto para el inicio automático (primera vez)
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setRun(true);
      if (onOpenSidebar) {
        onOpenSidebar();
      }
    }
  }, [onOpenSidebar]);

  // Efecto para el inicio manual (botón de tutorial)
  useEffect(() => {
    if (shouldStart) {
      setRun(true);
      if (onOpenSidebar) {
        onOpenSidebar();
      }
    } else {
      setRun(false);
    }
  }, [shouldStart, onOpenSidebar]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTutorial', 'true');
      if (onEnd) {
        onEnd();
      }
    }
  };

  if (!run && !shouldStart) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#f97316', // Color naranja que coincide con tu tema
          backgroundColor: isDarkMode ? '#1a1f2e' : '#ffffff',
          textColor: isDarkMode ? '#ffffff' : '#000000',
          arrowColor: isDarkMode ? '#1a1f2e' : '#ffffff',
        },
      }}
      locale={{
        last: 'Finalizar',
        skip: 'Saltar tutorial',
        next: 'Siguiente',
        back: 'Anterior',
      }}
    />
  );
};

export default Tutorial; 