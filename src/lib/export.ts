import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";

export async function exportToImage(element: HTMLElement, fileName: string) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const dataUrl = canvas.toDataURL("image/png");

    if (Capacitor.isNativePlatform()) {
      const base64Data = dataUrl.split(',')[1];
      const path = `${fileName}.png`;
      
      const savedFile = await Filesystem.writeFile({
        path,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: fileName,
        text: 'Sharing bill image',
        url: savedFile.uri,
        dialogTitle: 'Share Bill Image'
      });
    } else {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      link.click();
    }
    return true;
  } catch (error) {
    console.error("Image Export Error:", error);
    throw error;
  }
}

export async function exportToPDF(element: HTMLElement, fileName: string) {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const dataUrl = canvas.toDataURL("image/png");
    
    const imgWidth = element.offsetWidth;
    const imgHeight = element.offsetHeight;
    
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? "landscape" : "portrait",
      unit: "px",
      format: [imgWidth, imgHeight],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight);
    
    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const path = `${fileName}.pdf`;

      const savedFile = await Filesystem.writeFile({
        path,
        data: pdfBase64,
        directory: Directory.Cache
      });

      await Share.share({
        title: fileName,
        text: 'Sharing bill PDF',
        url: savedFile.uri,
        dialogTitle: 'Share Bill PDF'
      });
    } else {
      pdf.save(`${fileName}.pdf`);
    }
    return true;
  } catch (error) {
    console.error("PDF Export Error:", error);
    throw error;
  }
}

export function printElement() {
  if (Capacitor.isNativePlatform()) {
    // On native, window.print() often doesn't work.
    // We suggest using the PDF export and sharing to print.
    const msg = "To print on mobile, please use the 'Save as PDF' option and then print the shared file.";
    alert(msg);
  } else {
    window.print();
  }
}
