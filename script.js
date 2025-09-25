const input = document.getElementById("fileInput");
const tableBody = document.querySelector("#fileTable tbody");
const autoDL = document.getElementById("autoDL");
const notifySound = document.getElementById("notifySound");
const zipDL = document.getElementById("zipDL");
const convertBtn = document.getElementById("convertBtn");
const ding = document.getElementById("ding");
const dlDing = document.getElementById("dlDing");

const MAX_SIZE = 1024*1024*1024; // 1GB
const audioExtensions = ["mp3","wav","aac","ogg","flac","m4a"];
const videoExtensions = ["mp4","mov","avi","mkv","webm"];
const imageExtensions = ["jpg","jpeg","png","gif","webp"];

let fileList = [];

// 自動DLONなら完了通知音無効
autoDL.addEventListener("change",()=>{
    if(autoDL.checked){
        notifySound.checked = false;
        notifySound.disabled = true;
    } else notifySound.disabled = false;
});

// ファイル選択
input.addEventListener("change",()=>{
    tableBody.innerHTML = "";
    fileList = [];
    let totalSize = 0;

    for(const file of input.files){
        totalSize += file.size;
        if(totalSize > MAX_SIZE){
            alert("合計サイズが1GBを超えています！");
            input.value = "";
            return;
        }

        const ext = file.name.split(".").pop().toLowerCase();
        let typeIcon = "";
        if(audioExtensions.includes(ext)) typeIcon = "🎵";
        else if(videoExtensions.includes(ext)) typeIcon = "🎬";
        else if(imageExtensions.includes(ext)) typeIcon = "🖼️";
        else continue;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${typeIcon}</td>
            <td>${file.name}</td>
            <td><div class="progress-bar" id="progress-${file.name.replace(/\W/g,'')}"></div></td>
            <td>
                <select>
                    ${audioExtensions.includes(ext)?audioExtensions.map(f=>`<option>${f}</option>`).join(""):""}
                    ${videoExtensions.includes(ext)?videoExtensions.map(f=>`<option>${f}</option>`).join(""):""}
                    ${imageExtensions.includes(ext)?imageExtensions.map(f=>`<option>${f}</option>`).join(""):""}
                </select>
            </td>
        `;
        tableBody.appendChild(row);

        fileList.push({file,row});
    }
});

// 変換ボタン押下
convertBtn.addEventListener("click",async()=>{
    convertBtn.disabled = true;
    convertBtn.textContent = "変換中...";
    
    for(const item of fileList){
        const progress = item.row.querySelector(".progress-bar");
        for(let i=0;i<=100;i+=10){
            await new Promise(r=>setTimeout(r,100));
            progress.style.width = i + "%";
        }
        // 仮想DL処理
        if(zipDL.checked || autoDL.checked){
            // ZIP生成や自動DL処理
            dlDing.play(); // 自動DL用通知音
        } else if(notifySound.checked){
            ding.play();
        }
        // ボタン切替
        item.row.querySelector("td:last-child").innerHTML = `<button>ダウンロード</button>`;
    }

    convertBtn.disabled = false;
    convertBtn.textContent = "変換";
});
