'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Nominee, Category } from '@/lib/types';
import { toast } from 'sonner';
import { Loader2, Download, Image as ImageIcon, Settings2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function FlyerGenerator() {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [nomineePhotoBase64, setNomineePhotoBase64] = useState<string | null>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Layout State
  const [loayout, setLayout] = useState({
    photograph: { top: 31, height: 26, width: 62, borderRadius: 150 },
    category: { show: true, top: 22.5, fontSize: 24, color: '#ffffff' },
    name: { top: 62, fontSize: 32, color: '#102a43' },
    code: { top: 73, fontSize: 50, color: '#8b1515' }
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('nominees').select(&*, category:categories(*)').eq('is_active', true).order('name');
      if (data) setNominees(data as Nominee[]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedNominee && selectedNominee.photo_url) {
      // Fetch image and convert to base64 to avoid html2canvas CORS issues
      fetch(selectedNominee.photo_url)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => setNomineePhotoBase64(reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(err => {
           console.error("Failed to load photo as base64", err);
           setNomineePhotoBase64(selectedNominee.photo_url);
        });
    } else {
      setNomineePhotoBase64(null);
    }
  }, [selectedNominee]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0y;
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBgImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const downloadFlyer = async () => {
    if (!flyerRef.current || !selectedNominee || !bgImage) return;
    setGenerating(true);

    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const image = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${selectedNominee.name.replace(/\s+/g, '_')}_Flyer.jpg`;
      link.click();
      toast.success('Flyer downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error generating flyer');
    }
    setGenerating(false);
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 text-gold-400 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-rxl font-bold text-dark-100">Automated Flyer Generator</h1>
        <p className="text-dark-400 text-sm">Upload your blank template, adjust the positions, and instantly generate flyers for any nominee.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-bold text-lg text-gold-400 flex items-center gap-2"><ImageIcon className="w-5 h-5"/> 1. Setup Base</h2>

            <div>
              <label className="form-label">Blank Background Template</label>
              <input type="file" accept="image/*" onChange={handleBgUpload} className="form-input text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-gold-500 file:text-dark-950 hover:file:bg-gold-400" />
            </div>

            <div>
              <label className="form-label">Select Nominee to Render</label>
              <select className="form-select" onChange={e => setSelectedNominee(nominees.find(n => n.id === e.target.value) || null)}>
                <option value="">-- Choose a Nominee --</option>
                {nominees.map(n => <option key={n.id} value={n.id}>{n.name} (2oh[nm+) ${n.category?.name}</option>)}
              </select>
            </div>
          </div>

          {bgImage && selectedNominee && (
            <div className="glass-card p-6 space-y-6">
              <h2 className="font-bold text-lg text-gold-400 flex items-center gap-2"><Settings2 className="w-5 h-5"/> 2. Adjust Positions</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                  <h3 className="text-sm font-bold text-dark-200">Category Text</h3>
                  <label className="flex items-center gap-2 text-xs text-dark-400 cursor-pointer">
                    <input type="checkbox" checked={layout.category.show} onChange={e => setLayout({...layout, category: {...layout.category, show: e.target.checked}})} className="accent-gold-500" />
                    Show Text
                  </label>
                </div>
                {layout.category.show && (
                  <div className="flex gap-4">
                    <div className="flex-1"><label className="text-xs text-dark-400">Position (Top %)</label><input type="range" min="0" max="100" step="0.5" value={layout.category.top} onChange={e => setLayout({...layout category: {...layout.category, top: parseFloat(e.target.value)}}) className="w-full accent-gold-500" /></div>
                    <div className="w-24"><label className="text-xs text-dark-400">Size (px)</label><input type="number" value={layout.category.fontSize} onChange={e => setLayout({...layout category: {...layout.category, fontSize: parseInt(e.target.value)}}) className="form-input !py-1 !px-2 text-xs" /></div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-dark-200 border-b border-dark-800 pb-2">Nominee Photo</h3>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-dark-400">Position (Top %)</label><input type="range" min="0" max="100" step="0.5" value={layout.photograph.top} onChange={e => setLayout({...layout, photograph: {...layout.photograph, top: parseFloat(e.target.value)}}) } className="w-full accent-gold-500" /></div>
                  <div className="w-24"><label className="text-xs text-dark-400">Height %</label><input type="number" value={layout.photograph.height} onChange={e => setLayout({...layout, photograph: {...layout.photograph, height: parseInt(e.target.value)})} className="form-input !py-1 !px-2 text-xs" /></div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1"><label className="text-xs text-dark-400">Width %</label><input type="range" min="10" max="100" value={layout.photograph.width} onChange={e => setLayout({...layout, photograph: {...layout.photograph, width: parseInt(e.target.value)})} className="w-full accent-gold-500" /></div>
                  <div className="w-24"><label className="text-xs text-dark-400">Rounding</label><input type="number" value={layout.photograph.borderRadius} onChange={e =>͕�1���С츸�����а����ѽ�Ʌ���츸�����й���ѽ�Ʌ������ɑ��I���������͕%�С��хɝ�йم�Ք����􁍱���9���􉙽ɴ�����Ѐ���Ā���ȁѕ�е�̈���𽑥��(����������������𽑥��(��������������𽑥��((���������������؁�����9�����������Ј�(�����������������́�����9����ѕ�еʹ����е�����ѕ�е��ɬ�������ɑ�ȵ����ɑ�ȵ��ɬ��������Ȉ�9�������9������(�����������������؁�����9���􉙱�������Ј�(�������������������؁�����9���􉙱��Ĉ�񱅉��������9����ѕ�е�́ѕ�е��ɬ������A�ͥѥ����Q�����𽱅�������Ё�����Ʌ����������������������ѕ����Ԉ�م�Ք������й�����ѽ�􁽹������픀���͕�1���С츸�����а������츸�����й������ѽ�����͕���С��хɝ�йم�Ք����􁍱���9����ܵ�ձ�������е������������𽑥��(�������������������؁�����9����ܴ�Ј�񱅉��������9����ѕ�е�́ѕ�е��ɬ������M�销���𽱅�������Ё�����յ��Ȉ�م�Ք������й���������M��􁽹������픀���͕�1���С츸�����а������츸�����й����������M������͕%�С��хɝ�йم�Ք����􁍱���9���􉙽ɴ�����Ѐ���Ā���ȁѕ�е�̈���𽑥��(����������������𽑥��(��������������𽑥��((���������������؁�����9�����������Ј�(�����������������́�����9����ѕ�еʹ����е�����ѕ�е��ɬ�������ɑ�ȵ����ɑ�ȵ��ɬ��������Ȉ�Y�ѥ���������(�����������������؁�����9���􉙱�������Ј�(�������������������؁�����9���􉙱��Ĉ�񱅉��������9����ѕ�е�́ѕ�е��ɬ������A�ͥѥ����Q�����𽱅�������Ё�����Ʌ����������������������ѕ����Ԉ�م�Ք������й�����ѽ�􁽹������픀��6WD���WB��������WB�6�FS��������WB�6�FR�F��'6Tf��B�R�F&vWB�f�VR��җ�6�74��S�'r�gV��66V�B�v��B�S"����F�c��F�b6�74��S�'r�#B#���&V�6�74��S�'FW�Bׇ2FW�B�F&��C#�6��R������&V��Ɩ�WBG�S�&�V�&W""f�VS׶���WB�6�FR�f��E6��W���6��vS׶R��6WD���WB��������WB�6�FS��������WB�6�FR�f��E6��S�'6T��B�R�F&vWB�f�VR��җ�6�74��S�&f�&�֖�WB����"FW�Bׇ2"����F�c���F�c���F�cࠢ��F�c��Т��F�cࠢ ���ƗfR&Wf�Wr��Т�F�b6�74��S�&�s�6���7��r#��F�b6�74��S�'7F�6��F��#B#��F�b6�74��S�&f�W��FV�2�6V�FW"�W7F�g��&WGvVV��"�B#�ƃ"6�74��S�&f��B�&��BFW�B��rFW�B�F&��#�ƗfR&Wf�Ws���#��'WGF�� ���6Ɩ6�׶F�v���DfǖW'� �F�6&�VCײ&t��vR��6V�V7FVD��֖�VR��vV�W&F��wТ6�74��S�&v��B�'F���"��BFW�B�6�f�W��FV�2�6V�FW"v�" ���vV�W&F��r����FW#"6�74��S�'r�B��B��FR�7��"����F�v���B6�74��S�'r�B��B"��ТF�v���BfǖW ���'WGF�����F�c� ��F�b6�74��S�&&r�F&�Ӄ&�V�FVB׆�&�&FW"&�&FW"�F&��s�Bf�W��FV�2�6V�FW"�W7F�g��6V�FW"�fW&f��rֆ�FFV�"7G��S׷�֖�V�v�C�sc�r����&t��vR����6�74��S�'FW�B�F&��SFW�B�6�#�W��B&6�w&�V�BFV��FRF�6VR&Wf�Ws�����6V�V7FVD��֖�VR����6�74��S�'FW�B�F&��SFW�B�6�#�6V�V7B��֖�VRF�&V�FW#��������F�b �&Vc׶fǖW%&VgТ6�74��S�'&V�F�fRׂ�WF�&r�v��FR6�F�r�'�� �7G��S׷�v�GF��sRr���v�GF��sS�r�7V7E&F��s��br�Т�Ɩ�r7&3׶&t��vW��C�$&6�w&�V�B"6�74��S�&'6��WFR��6WB�r�gV����gV���&�V7B�6�fW"��"7&�74�&�v���&�����W2"�� ���6FVv�'���Т����WB�6FVv�'��6��rbb (���������������������؁�����9���􉅉ͽ��є����д��ɥ��д��ѕ�е���ѕȁ�������屔���ѽ�聀������й��ѕ����ѽ�������(������������������������������屔��쁙���M��聀������й��ѕ���乙���M����ူ������聱���й��ѕ���乍���Ȱ����������耝ɥ����ͅ�̵͕ɥ��������]�����������ѕ��QɅ�͙�ɴ耝����ɍ�͔�����(�������������������������͕���ѕ�9���������ѕ���䁅́����������(����������������������������(��������������������𽑥��(��������������������((������������������켨�A��Ѽ���х���Ȁ���(�������������������؀(�������������������������9���􉅉ͽ��є������ٕə��ܵ�������������ѕ�̵���ѕȁ���ѥ�䵍��ѕȁ����Ʌ�����(����������������������屔���(����������������������ѽ�聀������й���ѽ�Ʌ���ѽ������(��������������������������聀������������й���ѽ�Ʌ���ݥ�Ѡ���������(����������������������ݥ�Ѡ聀������й���ѽ�Ʌ���ݥ�ѡ����(����������������������������聀������й���ѽ�Ʌ�������������(������������������������ɑ��Q��1���I�����聀������й���ѽ�Ʌ�����ɑ��I�������ူ(������������������������ɑ��Q��I����I�����聀������й���ѽ�Ʌ�����ɑ��I�������ူ(������������������������ɑ��	��ѽ�1���I�����耜������(������������������������ɑ��	��ѽ�I����I�����耜������(����������������������(�������������������(����������������������������A��ѽ	�͔�Ѐ���(����������������������񥵜��Ɍ���������A��ѽ	�͔��􁅱��9�������������9����ܵ�ձ�����ձ�������е��ٕȈ��ɽ��=ɥ���􉅹��嵽�̈���(����������������������耠(���������������������������������9����ѕ�е�Ʌ�����ѕ�еʹ��9��A��Ѽ������(����������������������(������������������𽑥��((������������������켨�9�������(�������������������؁�����9���􉅉ͽ��є����д��ɥ��д��ѕ�е���ѕȁ������Ј���屔���ѽ�聀������й�����ѽ�������(����������������������������屔��쁙���M��聀������й���������M����ူ������聱���й���������Ȱ����������耝��ɝ����͕ɥ��������]�����������ѕ��QɅ�͙�ɴ耝����ɍ�͔�����(�����������������������͕���ѕ�9������������(��������������������������(������������������𽑥��((������������������켨��������(�������������������؁�����9���􉅉ͽ��є����д��ɥ��д��ѕ�е���ѕȁ�������屔���ѽ�聀������й�����ѽ�������(����������������������������屔��쁙���M��聀������й���������M����ူ������聱���й���������Ȱ����������耝ɥ����ͅ�̵͕ɥ��������]�������������(�����������������������͕���ѕ�9������������(��������������������������(������������������𽑥��((����������������𽑥��(����������������(������������𽑥��(����������𽑥��(��������𽑥��((������𽑥��(����𽑥��(����)�(