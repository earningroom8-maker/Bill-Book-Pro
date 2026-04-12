import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

export async function exportToImage(element: HTMLElement, fileName: string) {
  try {
    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: "#ffffff",
      width: element.offsetWidth * 2,
      height: element.offsetHeight * 2,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left',
        width: element.offsetWidth + 'px',
        height: element.offsetHeight + 'px'
      }
    });

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
    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor: "#ffffff",
      width: element.offsetWidth * 2,
      height: element.offsetHeight * 2,
      style: {
        transform: 'scale(2)',
        transformOrigin: 'top left',
        width: element.offsetWidth + 'px',
        height: element.offsetHeight + 'px'
      }
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [element.offsetWidth, element.offsetHeight],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, element.offsetWidth, element.offsetHeight);
    
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
  window.print();
}
