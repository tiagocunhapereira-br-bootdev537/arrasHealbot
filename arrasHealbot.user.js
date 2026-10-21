// ==UserScript==
// @name         Arras.io Healbot
// @namespace    http://tampermonkey.net
// @version      1.2.0
// @description  Spams healing in sandbox, Numpad1 toggles, Numpad2 is the menu.
// @match        *://arras.io/*
// @run-at       document-start
// @grant        none
// @author       BazookaBoi6
// ==/UserScript==

(function () {
    'use strict';
    let configuracoes = {
        velocidadeSpam: 40,
        travarMiraNoCentro: true
    };

    let enabled = false;
    let loopCuraId = null;

    const painelConfig = document.createElement("div");
    painelConfig.id = "healbot-config-menu";
    Object.assign(painelConfig.style, {
        position: "fixed", top: "20px", right: "20px",
        width: "260px", padding: "15px", borderRadius: "12px",
        background: "rgba(10, 10, 18, 0.96)", color: "#ffffff",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", fontSize: "12px",
        border: "1px solid #6366f1", zIndex: "100001", display: "none",
        boxShadow: "0 10px 30px rgba(0,0,0,0.6)", lineHeight: "1.8"
    });

    document.documentElement.appendChild(painelConfig);

    function renderizarMenu() {
        painelConfig.innerHTML = `
            <div style="font-weight: bold; border-bottom: 1px solid #6366f1; margin-bottom: 10px; color: #a5b4fc; font-size: 13px; letter-spacing: 0.5px;">Settings Menu</div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; opacity: 0.8; margin-bottom: 4px;">Spammy spam speed (ms):</label>
                <input type="number" id="cfg-speed" value="${configuracoes.velocidadeSpam}" min="10" max="500" style="width: 100%; background: #000; border: 1px solid #444; color: #fff; padding: 6px 10px; border-radius: 6px; outline: none; box-sizing: border-box; font-family: monospace;">
            </div>
            <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="cfg-center" ${configuracoes.travarMiraNoCentro ? "checked" : ""} style="accent-color: #6366f1; width: 14px; height: 14px; cursor: pointer;">
                <label for="cfg-center" style="opacity: 0.8; cursor: pointer;">Lock Cursor In Middle</label>
            </div>
            <button id="cfg-salvar" style="width: 100%; background: #6366f1; border: none; color: #fff; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s;">Happy with these settings!</button>
            <div style="font-size: 9px; opacity: 0.4; margin-top: 10px; text-align: center;">Numpad 1: Toggle | Numpad 2: Menu</div>
        `;
        document.getElementById("cfg-salvar").onclick = () => {
            const novaVelocidade = parseInt(document.getElementById("cfg-speed").value, 10);
            if (!isNaN(novaVelocidade) && novaVelocidade >= 10) {
                configuracoes.velocidadeSpam = novaVelocidade;
            }
            configuracoes.travarMiraNoCentro = document.getElementById("cfg-center").checked;

            console.log("[Healbot] Settings saved:", configuracoes);
            if (enabled) {
                clearInterval(loopCuraId);
                loopCuraId = setInterval(executarCicloHealbot, configuracoes.velocidadeSpam);
            }

            const btn = document.getElementById("cfg-salvar");
            btn.style.background = "#22c55e";
            btn.textContent = "Reloaded!";
            setTimeout(() => {
                btn.style.background = "#6366f1";
                btn.textContent = "Happy with these settings!";
            }, 1000);
        };
    }
    const referencialNativoListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, callback, options) {
        if (type === "keydown" || type === "keyup" || type === "mousemove" || type === "pointermove") {
            const manipuladorOriginal = callback;
            callback = function (e) {
                if (e && e.itsMe) {
                    const evSimulado = {
                        isTrusted: true,
                        key: e.key,
                        code: e.code,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        pageX: e.clientX,
                        pageY: e.clientY,
                        bubbles: e.bubbles !== false,
                        cancelable: e.cancelable !== false,
                        composed: e.composed !== false,
                        preventDefault() { if (e.preventDefault) e.preventDefault(); },
                        stopPropagation() { if (e.stopPropagation) e.stopPropagation(); }
                    };
                    return manipuladorOriginal.apply(this, [evSimulado]);
                }
                return manipuladorOriginal.apply(this, [e]);
            };
        }
        return referencialNativoListener.call(this, type, callback, options);
    };
    function dispararTecla(code, key, pressionado) {
        const ev = new KeyboardEvent(pressionado ? "keydown" : "keyup", {
            key: key, code: code, bubbles: true, cancelable: true, composed: true
        });
        ev.itsMe = true;
        window.dispatchEvent(ev);
    }

    function simularMiraNoCentro() {
        const meioX = window.innerWidth / 2;
        const meioY = window.innerHeight / 2;

        const propriedadesPonteiro = {
            clientX: meioX,
            clientY: meioY,
            bubbles: true,
            cancelable: true,
            composed: true
        };
        const evMouse = new MouseEvent("mousemove", propriedadesPonteiro);
        const evPointer = new PointerEvent("pointermove", propriedadesPonteiro);

        evMouse.itsMe = true;
        evPointer.itsMe = true;
        const elementoAlvo = document.querySelector("canvas") || document.body;
        if (elementoAlvo) {
            elementoAlvo.dispatchEvent(evMouse);
            elementoAlvo.dispatchEvent(evPointer);
        }
    }
    function executarCicloHealbot() {
        if (configuracoes.travarMiraNoCentro) {
            simularMiraNoCentro();
        }
        dispararTecla("Backquote", "'", true);
        setTimeout(() => {
            dispararTecla("KeyH", "h", true);
            setTimeout(() => {
                dispararTecla("KeyH", "h", false);
                setTimeout(() => {
                    dispararTecla("Backquote", "'", false);
                }, 4);
            }, 4);
        }, 4);
    }
    referencialNativoListener.call(window, "keydown", (e) => {
        const caixaTextoAberta = document.querySelector("body > input[type=text]");
        if (caixaTextoAberta || e.itsMe) return;
        const ehNumpad1 = (e.code === "Numpad1") || (e.key === "1" && e.location === 3) || (e.code === "End" && e.location === 3);
        if (ehNumpad1) {
            e.preventDefault(); e.stopPropagation();

            if (!enabled) {
                enabled = true;
                console.log("[Healbot] Enabled! WOO!!!");
                executarCicloHealbot();
                loopCuraId = setInterval(executarCicloHealbot, configuracoes.velocidadeSpam);
            } else {
                enabled = false;
                clearInterval(loopCuraId);
                console.log("[Healbot] aw man disabled");
            }
        }
        const ehNumpad2 = (e.code === "Numpad2") || (e.key === "2" && e.location === 3) || (e.code === "ArrowDown" && e.location === 3);
        if (ehNumpad2) {
            e.preventDefault(); e.stopPropagation();

            const visivel = painelConfig.style.display === "block";
            if (!visivel) {
                renderizarMenu();
                painelConfig.style.display = "block";
            } else {
                painelConfig.style.display = "none";
            }
        }
    }, true);

})();
