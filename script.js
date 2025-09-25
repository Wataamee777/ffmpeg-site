const input = document.getElementById("fileInput");
const tableBody = document.querySelector("#fileTable tbody");
const convertBtn = document.getElementById("convertBtn");
const autoDL = document.getElementById("autoDL");
const notifySound = document.getElementById("notifySound");
const zipDL = document.getElementById("zipDL");
const ding = document.getElementById("ding");
const dlDing = document.getElementById("dlDing");

const audioExt = ["mp3","aac","flac","wav","alac","wma","ogg","tta","tak"];
const videoExt = ["mp4","mov","avi","mkv","webm","wmv","flv"];
const imageExt = ["jpg","jpeg","png","gif","webp","bmp","tiff","ico","heic"];

let files = [];
let ffmpegLoaded = false;

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log:true });

// 自動DL時は通知音OFF
autoDL.addEventListener("change",()=>{
  if(autoDL.checked){
    notifySound.checked = false;
    notifySound.disabled = true;
  } else notifySound.disabled = false;
});

// ファイル選択
input.addEventListener("change",()=>{
  tableBody.innerHTML = "";
  files = [];
  for(const file of input.files){
    const ext = file.name.split(".").pop().toLowerCase();
    if(!audioExt.includes(ext) && !videoExt.includes(ext) && !imageExt.includes(ext)) continue;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${audioExt.includes(ext)?"🎵":videoExt.includes(ext)?"🎬":"🖼️"}</td>
      <td>${file.name}</td>
      <td><div class="progress-bar" style="width:0%;height:10px;background:#4caf50;"></div></td>
      <td>
        <select>
          ${audioExt.includes(ext)?audioExt.map(e=>`<option>${e}</option>`).join(""):""}
          ${videoExt.includes(ext)?videoExt.map(e=>`<option>${e}</option>`).join(""):""}
          ${imageExt.includes(ext)?imageExt.map(e=>`<option>${e}</option>`).join(""):""}
        </select>
      </td>
    `;
    tableBody.appendChild(row);
    files.push({ file, row });
  }
});

// 単体変換
async function convertFile(item){
  const select = item.row.querySelector("select");
  const outputExt = select.value;
  const fileName = item.file.name;
  const outputName = fileName.replace(/\.[^/.]+$/, "") + "." + outputExt;

  if(!ffmpegLoaded){
    await ffmpeg.load();
    ffmpegLoaded = true;
  }

  ffmpeg.FS('writeFile', fileName, await fetchFile(item.file));

  ffmpeg.setProgress(({ ratio })=>{
    item.row.querySelector(".progress-bar").style.width = Math.floor(ratio*100)+"%";
  });

  try{
    await ffmpeg.run('-i', fileName, outputName);
    const data = ffmpeg.FS('readFile', outputName);
    const url = URL.createObjectURL(new Blob([data.buffer]));

    item.row.querySelector("td:last-child").innerHTML = `
      <a href="${url}" download="${outputName}">⬇️ ダウンロード</a>
    `;
    if(autoDL.checked) dlDing.play();
    else if(notifySound.checked) ding.play();
  } catch(err){
    item.row.querySelector("td:last-child").textContent = "変換エラー";
    console.error(err);
  }
}

// まとめ変換
convertBtn.addEventListener("click", async () => {
  convertBtn.disabled = true;
  convertBtn.textContent = "変換中...";
  for(const item of files){
    await convertFile(item);
  }

  // ZIPまとめDL（オプション）
  if(zipDL.checked && files.length>1){
    const zip = new JSZip();
    for(const item of files){
      const select = item.row.querySelector("select");
      const ext = select.value;
      const fname = item.file.name.replace(/\.[^/.]+$/, "")+"."+ext;
      const link = item.row.querySelector("a");
      const blob = await (await fetch(link.href)).blob();
      zip.file(fname, blob);
    }
    const zipBlob = await zip.generateAsync({type:"blob"});
    const zipURL = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = zipURL;
    a.download = "converted_files.zip";
    a.click();
    dlDing.play();
  }

  convertBtn.disabled = false;
  convertBtn.textContent = "変換完了";
});
