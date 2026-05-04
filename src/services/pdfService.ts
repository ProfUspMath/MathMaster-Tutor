import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateExercisesPDF = async (elementId: string, filename: string = 'guia_ejercicios.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found for PDF generation');
    return;
  }

  // Pre-prepare: html2canvas is sensitive to display: none. 
  // We use a different technique: ensure it's in the DOM but off-screen.
  const originalDisplay = element.style.display;
  const originalPosition = element.style.position;
  const originalVisibility = element.style.visibility;
  const originalLeft = element.style.left;

  element.style.display = 'block';
  element.style.position = 'fixed';
  element.style.left = '-10000px';
  element.style.visibility = 'visible';

  try {
    // Wait a brief moment for any KaTeX transitions
    await new Promise(resolve => setTimeout(resolve, 800));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.style.display = 'block';
          clonedElement.style.visibility = 'visible';
          
          // Remove potential problematic CSS variables globally in the clone
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const css = styleTags[i].innerHTML;
            if (css.includes('oklch')) {
              // Replace oklch patterns with a safe hex fallback using regex or just clear the style if it's Tailwind's main block
              // Since we're in a clone, we can safely overwrite it
              styleTags[i].innerHTML = css.replace(/oklch\([^)]+\)/g, '#000000');
            }
          }

          // Force black text for all math elements in the PDF
          const mathElements = clonedElement.querySelectorAll('.katex');
          mathElements.forEach((el) => {
            (el as HTMLElement).style.setProperty('color', '#000000', 'important');
          });
        }
      }
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Remaining pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Generate blob and trigger manual download using the main document
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); // Using the main document
    link.href = url;
    link.download = filename;
    document.body.appendChild(link); // Using the main document body
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que los ejercicios se vean correctamente en pantalla e intenta de nuevo.');
  } finally {
    // Restore
    element.style.display = originalDisplay;
    element.style.position = originalPosition;
    element.style.visibility = originalVisibility;
    element.style.left = originalLeft;
  }
};
