"use strict";
const pick = (selector) => document.querySelector(selector);
const cases = window.RAWAGENT_CASES;
const wipe = pick("#wipe");
const comparison = pick("#comparison");
function adjustWipe() {
  const value = Number(wipe.value);
  comparison.style.setProperty("--split", value+"%");
  wipe.setAttribute("aria-valuetext", "RAW 显示宽度 "+value+"%");
  pick(".tag-raw").style.opacity = value < 16 ? "0" : "1";
  pick(".tag-out").style.opacity = value > 81 ? "0" : "1";
}
wipe.addEventListener("input", adjustWipe);
function selectCase(item) {
  const image = pick("#img-output");
  image.src = item.output;
  image.alt = item.title+"的 v1.1.0 彩色重建";
  pick("#img-raw").src = item.raw;
  pick("#case-title").textContent = item.title;
  pick("#view-layout").textContent = item.layout+" / "+item.level;
  pick("#case-metrics").textContent = "PSNR "+item.psnr.toFixed(2)+" dB";
  for (const button of pick("#case-picker").children) {
    button.setAttribute("aria-pressed", String(button.dataset.id === item.id));
  }
}
for (const item of cases) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.id = item.id;
  button.title = item.title;
  button.setAttribute("aria-label","对照样张："+item.title);
  const thumb = document.createElement("img");
  thumb.src = item.thumb;
  thumb.alt = "";
  button.append(thumb);
  button.addEventListener("click",()=>selectCase(item));
  pick("#case-picker").append(button);
  const row = document.createElement("div");
  row.className = "credit-item";
  const name = document.createElement("b");
  name.textContent = item.shortTitle;
  const source = document.createElement("a");
  source.href = item.sourceUrl;
  source.target = "_blank";
  source.rel = "noopener";
  source.textContent = item.credit+" · "+item.license;
  row.append(name,source);
  pick("#credits-list").append(row);
}
selectCase(cases[0]); adjustWipe();
const filters = {
  R: {color:"#ee977f", weights:[1,0,0]}, G:{color:"#a5d29a",weights:[0,1,0]}, B:{color:"#82aeda",weights:[0,0,1]},
  W:{color:"#e4e7cf",weights:[.72,.86,.62]}, C:{color:"#88d3cf",weights:[.02,.70,.86]},
  Y:{color:"#e6d778",weights:[.82,.88,.03]}, M:{color:"#d99dc4",weights:[.77,.04,.75]}
};
const layouts = [
  {id:"RGGB", title:"Bayer RGGB 阵列", description:"每个 2 × 2 单元有两个绿色、一个红色和一个蓝色滤镜。绿色测量较密，缺失的颜色需要从周围像素推断。", tile:["RG","GB"],names:"RGB"},
  {id:"RGBW", title:"带白色通道的 RGBW 阵列", description:"白色滤镜同时接收多个颜色方向的光。它在暗处收集更多光子，程序需要用标定响应将亮度信息与颜色分开。",tile:["RG","WB"],names:"RGBW"},
  {id:"CYGM",title:"互补色 CYGM 阵列",description:"青、黄和品红滤镜各自混合多个颜色方向。标定矩阵告诉程序每个读数包含多少红、绿和蓝的贡献。",tile:["CY","GM"],names:"CYGM"},
  {id:"Random4x4",label:"Random 4×4",title:"固定伪随机 4 × 4 阵列",description:"红、绿、蓝位置在更大的单元中交错排列。解码时需要读取这块传感器实际的周期和相位。",tile:["BGRG","GGBR","RBGG","GRGB"],names:"RGB"}
];
function selectLayout(layout) {
  pick("#tile-code").textContent = layout.label || layout.id;
  pick("#layout-title").textContent = layout.title;
  pick("#layout-desc").textContent = layout.description;
  pick("#tile-size").textContent = layout.tile[0].length+" × "+layout.tile.length;
  pick("#tile-names").textContent = layout.names.split("").join(" / ");
  const cells = document.createDocumentFragment();
  for(let y=0;y<8;y++) for(let x=0;x<8;x++) {
    const code = layout.tile[y%layout.tile.length][x%layout.tile[0].length];
    const cell = document.createElement("span");
    cell.className = "cell";
    cell.textContent = code;
    cell.style.backgroundColor = filters[code].color;
    cells.append(cell);
  }
  pick("#pattern").replaceChildren(cells);
  pick("#sensor-legend").innerHTML = [...layout.names].map(name=>'<span><i style="background:'+filters[name].color+'"></i>'+name+'</span>').join("");
  const rows = [...layout.names].map(name=>"<tr><th scope='row'>"+name+"</th>"+filters[name].weights.map(v=>"<td>"+v.toFixed(2)+"</td>").join("")+"</tr>").join("");
  pick("#calibrations").innerHTML = "<table><thead><tr><th>滤镜</th><th>R</th><th>G</th><th>B</th></tr></thead><tbody>"+rows+"</tbody></table>";
  for(const button of pick("#layout-picker").children) button.setAttribute("aria-pressed",String(button.dataset.id===layout.id));
}
for(const layout of layouts) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.id = layout.id;
  button.textContent = layout.label || layout.id;
  button.addEventListener("click",()=>selectLayout(layout));
  pick("#layout-picker").append(button);
}
selectLayout(layouts[0]);
for(const button of document.querySelectorAll("[data-present]")) {
  button.addEventListener("click",()=>window.RawAgentProjection.open());
}
const creditDialog = pick("#credits");
pick("#credit-open").addEventListener("click",()=>creditDialog.showModal());
pick("#close-credit").addEventListener("click",()=>creditDialog.close());
creditDialog.addEventListener("click",e=>{if(e.target===creditDialog){const b=creditDialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)creditDialog.close();}});
const nav = pick(".navlinks");
const menuButton = pick("#menu-button");
const closeMenu = () => {nav.classList.remove("open");menuButton.setAttribute("aria-expanded","false");};
menuButton.addEventListener("click",()=>{
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){closeMenu();menuButton.focus();}});
document.addEventListener("click",e=>{if(!e.target.closest(".navrow"))closeMenu();});
nav.addEventListener("click",closeMenu);
const navLinks = Array.from(nav.querySelectorAll("a"));
const targets = navLinks.map(a=>document.querySelector(a.hash));
function markSection(){
  let index=0;
  for(let n=0;n<targets.length;n++) if(targets[n] && targets[n].getBoundingClientRect().top<=110) index=n;
  if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2) index=targets.length-1;
  navLinks.forEach((link,n)=>{link.classList.toggle("current",n===index);if(n===index)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current");});
}
let pending=false;
window.addEventListener("scroll",()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;markSection();});}},{passive:true});markSection();
