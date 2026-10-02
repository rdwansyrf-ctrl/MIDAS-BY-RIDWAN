// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod wasapi_engine;
mod dsp;

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use wasapi_engine::{AudioDeviceInfo, NativeAudioDiagnostics, WasapiAudioEngine};

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioConfigPayload {
    pub backend: String,
    pub input_device: String,
    pub output_device: String,
    pub sample_rate: u32,
    pub buffer_size: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MeterPayload {
    pub channel_meters: Vec<f32>,
    pub master_l: f32,
    pub master_r: f32,
    pub mono_c: f32,
}

// 1. Enumerate Windows Audio Devices (WASAPI / Loopback / ASIO)
#[tauri::command]
fn enumerate_audio_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    WasapiAudioEngine::enumerate_devices()
}

// 2. Configure Audio Backend and Devices
#[tauri::command]
fn configure_audio_device(config: AudioConfigPayload) -> Result<bool, String> {
    println!("Configuring native Windows audio: {:?}", config);
    WasapiAudioEngine::get_instance().configure(config)
}

// 3. Start WASAPI Loopback Capture
#[tauri::command]
fn start_wasapi_loopback() -> Result<bool, String> {
    WasapiAudioEngine::get_instance().start_loopback()
}

// 4. Get Real-Time Audio Meters
#[tauri::command]
fn get_audio_meters() -> MeterPayload {
    WasapiAudioEngine::get_instance().get_meters()
}

// 5. Get Real-Time Native Audio Diagnostics
#[tauri::command]
fn get_native_diagnostics() -> NativeAudioDiagnostics {
    WasapiAudioEngine::get_instance().get_diagnostics()
}

// 6. Set Channel Fader & Gain
#[tauri::command]
fn set_channel_fader(channel_idx: usize, fader_db: f32) {
    WasapiAudioEngine::get_instance().set_channel_fader(channel_idx, fader_db);
}

#[tauri::command]
fn set_channel_gain(channel_idx: usize, gain_db: f32) {
    WasapiAudioEngine::get_instance().set_channel_gain(channel_idx, gain_db);
}

// 7. Set Master Fader
#[tauri::command]
fn set_master_fader(fader_db: f32, muted: bool) {
    WasapiAudioEngine::get_instance().set_master_fader(fader_db, muted);
}

// 8. Set Stereo Link for CH01 & CH02
#[tauri::command]
fn set_stereo_link(enabled: bool) {
    WasapiAudioEngine::get_instance().set_stereo_link_1_2(enabled);
}

// 9. Native Project File Save (.rdwnmix)
#[tauri::command]
fn save_project_file(filename: String, content: String) -> Result<String, String> {
    let mut appdata = dirs_next::data_dir().unwrap_or_else(|| PathBuf::from("."));
    appdata.push("RDWN_M32_Live_Training_Simulator");
    appdata.push("Projects");
    fs::create_dir_all(&appdata).map_err(|e| e.to_string())?;

    let file_path = appdata.join(if filename.ends_with(".rdwnmix") {
        filename
    } else {
        format!("{}.rdwnmix", filename)
    });

    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

// 10. Native Project File Load
#[tauri::command]
fn load_project_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

// 11. Start Native Real-Time WAV Recording
#[tauri::command]
fn start_recording() -> Result<bool, String> {
    WasapiAudioEngine::get_instance().start_recording()
}

// 12. Stop Native WAV Recording
#[tauri::command]
fn stop_recording() -> Result<String, String> {
    WasapiAudioEngine::get_instance().stop_recording()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            enumerate_audio_devices,
            configure_audio_device,
            start_wasapi_loopback,
            get_audio_meters,
            get_native_diagnostics,
            set_channel_fader,
            set_channel_gain,
            set_master_fader,
            set_stereo_link,
            save_project_file,
            load_project_file,
            start_recording,
            stop_recording
        ])
        .run(tauri::generate_context!())
        .expect("error while running RDWN M32 Live Training Simulator desktop application");
}
