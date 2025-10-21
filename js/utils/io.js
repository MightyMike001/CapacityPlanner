export function download(filename, text) {
  const anchor = document.createElement("a");
  anchor.href = `data:application/json;charset=utf-8,${encodeURIComponent(text)}`;
  anchor.download = filename;
  anchor.click();
}

export function uploadJSON() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = () => {
      const [file] = input.files || [];
      if (!file) {
        reject(new Error("Geen bestand"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}
