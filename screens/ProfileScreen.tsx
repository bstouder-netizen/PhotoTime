import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, ActivityIndicator, Alert, Image, Linking, Switch, Modal,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import { GlassPanel, useColors, GlassColors } from '../components/Glass';
import { PHOTO_SPECIALTIES } from '../lib/specialties';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const DEFAULT_LOCATION_PHOTO = 'https://picsum.photos/seed/photolocation/600/400';

type ProfileLocation = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  photo_url?: string;
  created_at: string;
};

type Endorsement = {
  id: string;
  endorser_name: string;
  text: string;
  created_at: string;
};

type StoreItem = {
  id: string;
  device_id: string;
  title: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  link: string | null;
  created_at: string;
};

type Profile = {
  id?: string;
  device_id: string;
  username: string;
  person_name: string;
  business_name: string;
  profile_pic: string;
  location: string;
  zip_code: string;
  email?: string;
  email_public?: boolean;
  website?: string;
  specialty?: string;
  pricing_tier?: string;
  portfolio_1?: string;
  portfolio_2?: string;
  portfolio_3?: string;
  portfolio_4?: string;
  portfolio_5?: string;
};

const EMPTY = {
  username: '', person_name: '', business_name: '', profile_pic: '',
  location: '', zip_code: '', email: '', email_public: false, website: '', specialty: '', pricing_tier: '',
};

export default function ProfileScreen({ navigation, route }: any) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const viewDeviceId: string | undefined = route?.params?.viewDeviceId;
  const isViewingOther = !!viewDeviceId;

  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'info' | 'portfolio' | 'endorsements' | 'locations' | 'store'>('info');
  const [portfolioPics, setPortfolioPics] = useState<(string | null)[]>([null, null, null, null, null]);
  const [portfolioUploading, setPortfolioUploading] = useState<boolean[]>([false, false, false, false, false]);
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [endorseModalVisible, setEndorseModalVisible] = useState(false);
  const [specialtyPickerVisible, setSpecialtyPickerVisible] = useState(false);
  const [endorseText, setEndorseText] = useState('');
  const [endorseSubmitting, setEndorseSubmitting] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const [profileLocations, setProfileLocations] = useState<ProfileLocation[]>([]);
  const [locModalVisible, setLocModalVisible] = useState(false);
  const [locName, setLocName] = useState('');
  const [locDescription, setLocDescription] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locSaving, setLocSaving] = useState(false);
  const [locPhotoUri, setLocPhotoUri] = useState<string | null>(null);

  // Store tab state
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [storeModalVisible, setStoreModalVisible] = useState(false);
  const [storeItemTitle, setStoreItemTitle] = useState('');
  const [storeItemPrice, setStoreItemPrice] = useState('');
  const [storeItemDescription, setStoreItemDescription] = useState('');
  const [storeItemImageUrl, setStoreItemImageUrl] = useState('');
  const [storeItemLink, setStoreItemLink] = useState('');
  const [storeItemSaving, setStoreItemSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    getDeviceId().then(id => {
      setCurrentDeviceId(id);
      // For other users' profiles, load their data; endorsements/locations use the target device
      const targetId = viewDeviceId ?? id;
      fetchEndorsements(targetId);
      fetchProfileLocations(targetId);
      fetchStoreItems(targetId);
    });
  }, [viewDeviceId]);

  const fetchStoreItems = async (deviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });
      if (!error && data) setStoreItems(data);
    } catch {
      // table may not exist yet — fail gracefully
    }
  };

  const handleAddStoreItem = async () => {
    if (!storeItemTitle.trim()) { Alert.alert('Required', 'Title is required.'); return; }
    setStoreItemSaving(true);
    const { error } = await supabase.from('store_items').insert([{
      device_id: currentDeviceId,
      title: storeItemTitle.trim(),
      price: storeItemPrice.trim() || null,
      description: storeItemDescription.trim() || null,
      image_url: storeItemImageUrl.trim() || null,
      link: storeItemLink.trim() || null,
    }]);
    setStoreItemSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setStoreItemTitle('');
    setStoreItemPrice('');
    setStoreItemDescription('');
    setStoreItemImageUrl('');
    setStoreItemLink('');
    setStoreModalVisible(false);
    fetchStoreItems(currentDeviceId);
  };

  const handleDeleteStoreItem = (itemId: string) => {
    Alert.alert('Delete Item', 'Remove this item from your store?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('store_items').delete().eq('id', itemId);
        fetchStoreItems(currentDeviceId);
      }},
    ]);
  };

  const fetchProfileLocations = async (deviceId: string) => {
    const { data } = await supabase
      .from('scouted_locations')
      .select('id, name, description, address, photo_url, created_at')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });
    if (data) setProfileLocations(data);
  };

  const handleAddLocation = async () => {
    if (!locName.trim()) { Alert.alert('Required', 'Location name is required.'); return; }
    setLocSaving(true);
    let lat = 0;
    let lng = 0;
    if (locAddress.trim()) {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locAddress.trim())}&limit=1`);
        const json = await res.json();
        const features = json?.features;
        if (features?.length > 0) {
          [lng, lat] = features[0].geometry.coordinates;
        }
      } catch { /* geocode failed, save without coords */ }
    }
    let photoUrl: string | null = null;
    if (locPhotoUri) {
      try {
        const fileName = `locations/${currentDeviceId}_${Date.now()}.jpg`;
        const blob = await (await fetch(locPhotoUri)).blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: upErr } = await supabase.storage
          .from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
        if (!upErr) {
          photoUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
        }
      } catch { /* upload failed, proceed without photo */ }
    }
    const { error } = await supabase.from('scouted_locations').insert([{
      name: locName.trim(),
      description: locDescription.trim() || null,
      address: locAddress.trim() || null,
      latitude: lat,
      longitude: lng,
      photo_url: photoUrl,
      device_id: currentDeviceId,
      posted_by: profile?.username ?? '',
    }]);
    setLocSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setLocName(''); setLocDescription(''); setLocAddress(''); setLocPhotoUri(null);
    setLocModalVisible(false);
    fetchProfileLocations(currentDeviceId);
  };

  const pickLocPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setLocPhotoUri(asset.uri);
    });
  };

  const handleDeleteLocation = (id: string) => {
    Alert.alert('Delete Location', 'Remove this location from your profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('scouted_locations').delete().eq('id', id);
        fetchProfileLocations(currentDeviceId);
      }},
    ]);
  };

  const fetchEndorsements = async (deviceId: string) => {
    const { data } = await supabase
      .from('endorsements')
      .select('id, endorser_name, text, created_at')
      .eq('profile_device_id', deviceId)
      .order('created_at', { ascending: false });
    if (data) setEndorsements(data);
  };

  const handleEndorse = async () => {
    if (!endorseText.trim()) { Alert.alert('Required', 'Please write something before submitting.'); return; }
    setEndorseSubmitting(true);
    const targetDeviceId = viewDeviceId ?? currentDeviceId;
    const endorserName = (await supabase.from('profiles').select('username').eq('device_id', currentDeviceId).single()).data?.username ?? 'Anonymous';
    const { error } = await supabase.from('endorsements').insert([{
      profile_device_id: targetDeviceId,
      endorser_device_id: currentDeviceId,
      endorser_name: endorserName,
      text: endorseText.trim(),
    }]);
    setEndorseSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setEndorseText('');
    setEndorseModalVisible(false);
    fetchEndorsements(targetDeviceId);
  };

  const fetchProfile = async () => {
    setLoading(true);
    const myDeviceId = await getDeviceId();
    const targetId = viewDeviceId ?? myDeviceId;
    const { data } = await supabase.from('profiles').select('*').eq('device_id', targetId).single();
    if (data) {
      setProfile(data);
      setForm({
        username: data.username ?? '', person_name: data.person_name ?? '',
        business_name: data.business_name ?? '', profile_pic: data.profile_pic ?? '',
        location: data.location ?? '', zip_code: data.zip_code ?? '',
        email: data.email ?? '', email_public: data.email_public ?? false,
        website: data.website ?? '', specialty: data.specialty ?? '', pricing_tier: data.pricing_tier ?? '',
      });
      setPortfolioPics([
        data.portfolio_1 || null, data.portfolio_2 || null, data.portfolio_3 || null,
        data.portfolio_4 || null, data.portfolio_5 || null,
      ]);
    }
    setLoading(false);
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setLocalImageUri(asset.uri);
      const deviceId = await getDeviceId();
      const fileName = `${deviceId}.jpg`;
      const blob = await (await fetch(asset.uri)).blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) { Alert.alert('Upload failed', uploadError.message); return; }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setForm(f => ({ ...f, profile_pic: urlData.publicUrl }));
    });
  };

  const pickPortfolioImage = (index: number) => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async response => {
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      setPortfolioUploading(prev => { const n = [...prev]; n[index] = true; return n; });
      try {
        const deviceId = await getDeviceId();
        const fileName = `portfolio/${deviceId}_${index + 1}.jpg`;
        const blob = await (await fetch(asset.uri)).blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) { Alert.alert('Upload failed', uploadError.message); return; }
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const newUrl = urlData.publicUrl;
        setPortfolioPics(prev => { const n = [...prev]; n[index] = newUrl; return n; });
        const { error: dbError } = await supabase.from('profiles')
          .update({ [`portfolio_${index + 1}`]: newUrl }).eq('device_id', deviceId);
        if (dbError) Alert.alert('Save failed', dbError.message);
      } finally {
        setPortfolioUploading(prev => { const n = [...prev]; n[index] = false; return n; });
      }
    });
  };

  const handleSave = async () => {
    if (!form.username.trim()) { Alert.alert('Required', 'User Name is required.'); return; }
    setSaving(true);
    const deviceId = await getDeviceId();
    const payload = { ...form, device_id: deviceId, location: form.location.trim() || null };
    let error;
    if (profile?.id) {
      ({ error } = await supabase.from('profiles').update(payload).eq('id', profile.id));
    } else {
      ({ error } = await supabase.from('profiles').insert([payload]));
    }
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); }
    else { setLocalImageUri(null); await fetchProfile(); setEditing(false); }
  };

  const avatarUri = localImageUri || form.profile_pic || null;

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header navigation={navigation} />
        <View style={styles.center}><ActivityIndicator size="large" color={C.accent} /></View>
      </View>
    );
  }

  if (!profile && !editing) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Header navigation={navigation} />
        <View style={styles.center}>
          <GlassPanel style={styles.noProfileCard}>
            <View style={styles.avatarCircle}><Text style={styles.avatarLabel}>PIC</Text></View>
            <Text style={styles.noProfileText}>No Profile</Text>
            <Text style={styles.subtext}>Set up your profile to get started.</Text>
            <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
              <Text style={styles.buttonText}>Create Profile</Text>
            </TouchableOpacity>
          </GlassPanel>
        </View>
      </View>
    );
  }

  if (editing) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={[styles.formContainer, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formHeading}>{profile ? 'Edit Profile' : 'Create Profile'}</Text>

        <Text style={styles.label}>Profile Pic</Text>
        <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
          {avatarUri
            ? <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarPlaceholderText}>📷  Choose Photo</Text></View>}
          <Text style={styles.changePhotoText}>{avatarUri ? 'Change Photo' : 'Select from Library'}</Text>
        </TouchableOpacity>

        {[
          { label: 'User Name *', key: 'username', placeholder: '@username', cap: 'none' as const },
          { label: 'Person Name', key: 'person_name', placeholder: 'Your full name', cap: 'words' as const },
          { label: 'Business Name', key: 'business_name', placeholder: 'Your studio or business name', cap: 'words' as const },
          { label: 'Location', key: 'location', placeholder: 'e.g. Portland, OR', cap: 'words' as const },
          { label: 'Zip Code', key: 'zip_code', placeholder: 'e.g. 90210', cap: 'none' as const },
        ].map(f => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}</Text>
            <GlassPanel style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor={C.textMuted}
                value={(form as any)[f.key]}
                onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                autoCapitalize={f.cap}
                keyboardType={f.key === 'zip_code' ? 'number-pad' : 'default'}
                maxLength={f.key === 'zip_code' ? 10 : undefined}
              />
            </GlassPanel>
          </View>
        ))}

        <Text style={styles.label}>Email</Text>
        <GlassPanel style={styles.inputWrap}>
          <TextInput
            style={styles.input} placeholder="you@example.com"
            placeholderTextColor={C.textMuted}
            value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))}
            keyboardType="email-address" autoCapitalize="none"
          />
        </GlassPanel>
        <GlassPanel style={styles.toggleRow}>
          <View style={styles.toggleTextBlock}>
            <Text style={styles.toggleTitle}>Show email publicly</Text>
            <Text style={styles.toggleSub}>Off keeps your email hidden from other users</Text>
          </View>
          <Switch
            value={form.email_public}
            onValueChange={v => setForm(f => ({ ...f, email_public: v }))}
            trackColor={{ false: 'rgba(255,255,255,0.2)', true: C.accent }}
            thumbColor="#fff"
          />
        </GlassPanel>

        <Text style={styles.label}>Website</Text>
        <GlassPanel style={styles.inputWrap}>
          <TextInput
            style={styles.input} placeholder="https://yoursite.com"
            placeholderTextColor={C.textMuted}
            value={form.website} onChangeText={v => setForm(f => ({ ...f, website: v }))}
            keyboardType="url" autoCapitalize="none"
          />
        </GlassPanel>

        <Text style={styles.label}>Specialty</Text>
        <TouchableOpacity onPress={() => setSpecialtyPickerVisible(true)}>
          <GlassPanel style={styles.pickerRow}>
            <Text style={form.specialty ? styles.pickerValue : styles.pickerPlaceholder}>
              {form.specialty || 'Select a specialty…'}
            </Text>
            <Text style={styles.pickerChevron}>▾</Text>
          </GlassPanel>
        </TouchableOpacity>

        <Modal visible={specialtyPickerVisible} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setSpecialtyPickerVisible(false)} />
          <GlassPanel style={styles.pickerSheet}>
            <View style={{ paddingBottom: insets.bottom + 8 }}>
              <View style={styles.pickerSheetHeader}>
                <Text style={styles.pickerSheetTitle}>Select Specialty</Text>
                <TouchableOpacity onPress={() => setSpecialtyPickerVisible(false)}>
                  <Text style={styles.pickerSheetDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={['', ...PHOTO_SPECIALTIES]}
                keyExtractor={item => item || '__none'}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => { setForm(f => ({ ...f, specialty: item })); setSpecialtyPickerVisible(false); }}
                  >
                    <Text style={[styles.pickerItemText, form.specialty === item && styles.pickerItemSelected]}>
                      {item || 'None'}
                    </Text>
                    {form.specialty === item && <Text style={styles.pickerCheck}>✓</Text>}
                  </TouchableOpacity>
                )}
              />
            </View>
          </GlassPanel>
        </Modal>

        <Text style={styles.label}>Pricing</Text>
        <View style={styles.pricingRow}>
          {['$', '$$', '$$$', '$$$$'].map(tier => (
            <TouchableOpacity
              key={tier}
              style={[styles.pricingChip, form.pricing_tier === tier && styles.pricingChipActive]}
              onPress={() => setForm(f => ({ ...f, pricing_tier: f.pricing_tier === tier ? '' : tier }))}
            >
              <Text style={[styles.pricingChipText, form.pricing_tier === tier && styles.pricingChipTextActive]}>
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.button, styles.saveBtn, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => { setLocalImageUri(null); setEditing(false); }}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header navigation={navigation} onEdit={isViewingOther ? undefined : () => setEditing(true)} onEndorsements={() => setTab('endorsements')} />

      <GlassPanel style={styles.identityRow}>
        {profile?.profile_pic
          ? <Image source={{ uri: profile.profile_pic }} style={styles.avatar} />
          : <View style={styles.avatarCircle}><Text style={styles.avatarLabel}>PIC</Text></View>}
        <View style={styles.identityText}>
          <Text style={styles.username}>@{profile?.username}</Text>
          {profile?.person_name ? <Text style={styles.personName}>{profile.person_name}</Text> : null}
          {profile?.business_name ? <Text style={styles.businessName}>{profile.business_name}</Text> : null}
          {(profile?.location || profile?.zip_code)
            ? <Text style={styles.locationText}>📍 {[profile.location, profile.zip_code].filter(Boolean).join(', ')}</Text>
            : null}
        </View>
      </GlassPanel>

      <GlassPanel style={styles.tabBar}>
        {(['info', 'portfolio', 'locations', 'endorsements', 'store'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tabItem, tab === t && styles.tabItemActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'endorsements' ? '★' : t === 'locations' ? '📍' : t === 'store' ? '🛍️' : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </GlassPanel>

      {tab === 'locations' ? (
        <ScrollView contentContainerStyle={[styles.locContainer, { paddingBottom: insets.bottom + 90 }]}>
          {!isViewingOther && (
            <TouchableOpacity style={styles.addLocBtn} onPress={() => setLocModalVisible(true)}>
              <Text style={styles.addLocBtnText}>＋  Add a Location</Text>
            </TouchableOpacity>
          )}
          {profileLocations.length === 0 ? (
            <GlassPanel style={styles.emptyEndorse}>
              <Text style={styles.emptyEndorseText}>No locations added yet.</Text>
            </GlassPanel>
          ) : (
            profileLocations.map(loc => (
              <GlassPanel key={loc.id} style={styles.locCard}>
                <Image
                  source={{ uri: loc.photo_url || DEFAULT_LOCATION_PHOTO }}
                  style={styles.locPhoto}
                  resizeMode="cover"
                />
                <View style={styles.locCardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locName}>{loc.name}</Text>
                    {loc.address ? <Text style={styles.locAddress}>📍 {loc.address}</Text> : null}
                    {loc.description ? <Text style={styles.locDesc}>{loc.description}</Text> : null}
                  </View>
                  {!isViewingOther && (
                    <TouchableOpacity onPress={() => handleDeleteLocation(loc.id)} style={styles.locDelete}>
                      <Text style={styles.locDeleteText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </GlassPanel>
            ))
          )}
        </ScrollView>
      ) : tab === 'endorsements' ? (
        <ScrollView contentContainerStyle={[styles.endorseContainer, { paddingBottom: insets.bottom + 90 }]}>
          <TouchableOpacity style={styles.writeEndorseBtn} onPress={() => setEndorseModalVisible(true)}>
            <Text style={styles.writeEndorseBtnText}>✦  Write an Endorsement</Text>
          </TouchableOpacity>
          {endorsements.length === 0 ? (
            <GlassPanel style={styles.emptyEndorse}>
              <Text style={styles.emptyEndorseText}>No endorsements yet.</Text>
            </GlassPanel>
          ) : (
            endorsements.map(e => (
              <GlassPanel key={e.id} style={styles.endorseCard}>
                <View style={styles.endorseCardHeader}>
                  <Text style={styles.endorseAuthor}>@{e.endorser_name}</Text>
                  <Text style={styles.endorseDate}>
                    {new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.endorseBody}>{e.text}</Text>
              </GlassPanel>
            ))
          )}
        </ScrollView>
      ) : tab === 'info' ? (
        <ScrollView contentContainerStyle={[styles.infoContainer, { paddingBottom: insets.bottom + 90 }]}>
          <InfoRow label="Username" value={`@${profile?.username}`} />
          {profile?.person_name ? <InfoRow label="Name" value={profile.person_name} /> : null}
          {profile?.business_name ? <InfoRow label="Business" value={profile.business_name} /> : null}
          {profile?.location ? <InfoRow label="Location" value={profile.location} /> : null}
          {profile?.zip_code ? <InfoRow label="Zip Code" value={profile.zip_code} /> : null}
          {profile?.specialty ? <InfoRow label="Specialty" value={profile.specialty} /> : null}
          {profile?.pricing_tier ? <InfoRow label="Pricing" value={profile.pricing_tier} /> : null}

          {((profile?.email && profile?.email_public) || profile?.website) &&
            <Text style={styles.contactSectionLabel}>CONTACT</Text>}
          {profile?.email && profile?.email_public && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${profile.email}`)}>
              <GlassPanel style={styles.contactRow}>
                <Text style={styles.contactIcon}>✉️</Text>
                <View style={styles.contactText}><Text style={styles.contactLabel}>Email</Text><Text style={styles.contactValue}>{profile.email}</Text></View>
                <Text style={styles.contactArrow}>›</Text>
              </GlassPanel>
            </TouchableOpacity>
          )}
          {profile?.website && (
            <TouchableOpacity onPress={() => { const u = profile.website!.startsWith('http') ? profile.website! : `https://${profile.website}`; Linking.openURL(u); }}>
              <GlassPanel style={styles.contactRow}>
                <Text style={styles.contactIcon}>🌐</Text>
                <View style={styles.contactText}><Text style={styles.contactLabel}>Website</Text><Text style={styles.contactValue}>{profile.website}</Text></View>
                <Text style={styles.contactArrow}>›</Text>
              </GlassPanel>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : tab === 'store' ? (
        <ScrollView contentContainerStyle={[styles.storeContainer, { paddingBottom: insets.bottom + 90 }]}>
          {!isViewingOther && (
            <TouchableOpacity style={styles.addStoreBtn} onPress={() => setStoreModalVisible(true)}>
              <Text style={styles.addStoreBtnText}>＋  Add Item</Text>
            </TouchableOpacity>
          )}
          {storeItems.length === 0 ? (
            <GlassPanel style={styles.emptyEndorse}>
              <Text style={styles.emptyEndorseText}>
                {isViewingOther ? 'No store items yet.' : 'No items in your store yet.'}
              </Text>
            </GlassPanel>
          ) : (
            storeItems.map(item => (
              <GlassPanel key={item.id} style={styles.storeCard}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.storeCardImage} resizeMode="cover" />
                ) : null}
                <View style={styles.storeCardBody}>
                  <View style={styles.storeCardTitleRow}>
                    <Text style={styles.storeCardTitle}>{item.title}</Text>
                    {item.price ? <Text style={styles.storeCardPrice}>{item.price}</Text> : null}
                    {!isViewingOther && (
                      <TouchableOpacity onPress={() => handleDeleteStoreItem(item.id)} style={styles.storeCardDelete}>
                        <Text style={styles.storeCardDeleteText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.description ? (
                    <Text style={styles.storeCardDesc}>{item.description}</Text>
                  ) : null}
                  {item.link ? (
                    <TouchableOpacity
                      onPress={() => {
                        const url = item.link!.startsWith('http') ? item.link! : `https://${item.link}`;
                        Linking.openURL(url).catch(() => {});
                      }}
                    >
                      <Text style={styles.storeCardLink}>View Item →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </GlassPanel>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[styles.portfolioContainer, { paddingBottom: insets.bottom + 90 }]}>
          {!isViewingOther && (
            <Text style={styles.portfolioHint}>Tap a slot to upload a photo</Text>
          )}
          <View style={styles.portfolioGrid}>
            {portfolioPics.map((uri, i) => {
              const slot = (
                <GlassPanel style={styles.portfolioPanel}>
                  {portfolioUploading[i] ? (
                    <ActivityIndicator color={C.accent} />
                  ) : uri ? (
                    <Image source={{ uri }} style={styles.portfolioImage} />
                  ) : (
                    !isViewingOther ? (
                      <>
                        <Text style={styles.portfolioEmptyIcon}>+</Text>
                        <Text style={styles.portfolioEmptyLabel}>Photo {i + 1}</Text>
                      </>
                    ) : null
                  )}
                </GlassPanel>
              );
              return isViewingOther ? (
                uri ? (
                  <View key={i} style={styles.portfolioSlot}>{slot}</View>
                ) : null
              ) : (
                <TouchableOpacity key={i} style={styles.portfolioSlot} onPress={() => pickPortfolioImage(i)} activeOpacity={0.75}>
                  {slot}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
      <EndorseModal
        visible={endorseModalVisible}
        onClose={() => setEndorseModalVisible(false)}
        profileName={profile?.person_name || profile?.username || ''}
        profilePic={profile?.profile_pic || null}
        text={endorseText}
        onChangeText={setEndorseText}
        onSubmit={handleEndorse}
        submitting={endorseSubmitting}
      />

      <Modal visible={!isViewingOther && storeModalVisible} transparent animationType="slide">
        <View style={styles.locOverlay}>
          <GlassPanel style={{ ...styles.locSheet, paddingBottom: insets.bottom + 16 }}>
            <View style={styles.locSheetHeader}>
              <Text style={styles.locSheetTitle}>🛍️ Add Store Item</Text>
              <TouchableOpacity onPress={() => setStoreModalVisible(false)}>
                <Text style={styles.locSheetCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Title *</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={storeItemTitle} onChangeText={setStoreItemTitle}
                  placeholder="e.g. Print Pack – 8x10" placeholderTextColor={C.textMuted} />
              </GlassPanel>
              <Text style={styles.label}>Price</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={storeItemPrice} onChangeText={setStoreItemPrice}
                  placeholder="e.g. $49" placeholderTextColor={C.textMuted} />
              </GlassPanel>
              <Text style={styles.label}>Description</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={storeItemDescription} onChangeText={setStoreItemDescription}
                  placeholder="Describe what you're selling..."
                  placeholderTextColor={C.textMuted} multiline numberOfLines={3} />
              </GlassPanel>
              <Text style={styles.label}>Image URL</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={storeItemImageUrl} onChangeText={setStoreItemImageUrl}
                  placeholder="https://..." placeholderTextColor={C.textMuted}
                  keyboardType="url" autoCapitalize="none" />
              </GlassPanel>
              <Text style={styles.label}>Link</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={storeItemLink} onChangeText={setStoreItemLink}
                  placeholder="https://..." placeholderTextColor={C.textMuted}
                  keyboardType="url" autoCapitalize="none" />
              </GlassPanel>
              <TouchableOpacity
                style={[styles.button, styles.saveBtn, storeItemSaving && styles.buttonDisabled]}
                onPress={handleAddStoreItem} disabled={storeItemSaving}
              >
                {storeItemSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>Add to Store</Text>}
              </TouchableOpacity>
            </ScrollView>
          </GlassPanel>
        </View>
      </Modal>

      <Modal visible={!isViewingOther && locModalVisible} transparent animationType="slide">
        <View style={styles.locOverlay}>
          <GlassPanel style={{ ...styles.locSheet, paddingBottom: insets.bottom + 16 }}>
            <View style={styles.locSheetHeader}>
              <Text style={styles.locSheetTitle}>📍 Add a Location</Text>
              <TouchableOpacity onPress={() => setLocModalVisible(false)}>
                <Text style={styles.locSheetCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.locPhotoPicker} onPress={pickLocPhoto}>
                {locPhotoUri
                  ? <Image source={{ uri: locPhotoUri }} style={styles.locPhotoPreview} />
                  : <Image source={{ uri: DEFAULT_LOCATION_PHOTO }} style={styles.locPhotoPreview} />}
                <View style={styles.locPhotoOverlay}>
                  <Text style={styles.locPhotoOverlayText}>📷  {locPhotoUri ? 'Change Photo' : 'Add Photo'}</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>Location Name *</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={locName} onChangeText={setLocName}
                  placeholder="e.g. Riverside Park" placeholderTextColor={C.textMuted} />
              </GlassPanel>
              <Text style={styles.label}>Address</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={styles.input} value={locAddress} onChangeText={setLocAddress}
                  placeholder="Street, City, State" placeholderTextColor={C.textMuted} />
              </GlassPanel>
              <Text style={styles.label}>Notes</Text>
              <GlassPanel style={styles.inputWrap}>
                <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
                  value={locDescription} onChangeText={setLocDescription}
                  placeholder="Best time to shoot, what to look for..."
                  placeholderTextColor={C.textMuted} multiline numberOfLines={4} />
              </GlassPanel>
              <TouchableOpacity
                style={[styles.button, styles.saveBtn, locSaving && styles.buttonDisabled]}
                onPress={handleAddLocation} disabled={locSaving}
              >
                {locSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Location</Text>}
              </TouchableOpacity>
            </ScrollView>
          </GlassPanel>
        </View>
      </Modal>
    </View>
  );
}

function EndorseModal({
  visible, onClose, profileName, profilePic, text, onChangeText, onSubmit, submitting,
}: {
  visible: boolean; onClose: () => void; profileName: string; profilePic: string | null;
  text: string; onChangeText: (v: string) => void; onSubmit: () => void; submitting: boolean;
}) {
  const C = useColors();
  const eStyles = useMemo(() => makeEStyles(C), [C]);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={eStyles.overlay}>
        <GlassPanel style={{ ...eStyles.sheet, paddingBottom: insets.bottom + 20 }}>
          <TouchableOpacity style={eStyles.closeBtn} onPress={onClose}>
            <Text style={eStyles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={eStyles.avatarWrap}>
            {profilePic
              ? <Image source={{ uri: profilePic }} style={eStyles.avatar} />
              : <View style={eStyles.avatarPlaceholder}><Text style={eStyles.avatarPlaceholderText}>PIC</Text></View>}
          </View>
          <Text style={eStyles.heading}>Write an Endorsement</Text>
          <Text style={eStyles.subheading}>Share your positive experience working with {profileName}</Text>
          <GlassPanel style={eStyles.inputWrap}>
            <TextInput
              style={eStyles.input}
              placeholder={`Write your endorsement here…\nTell others what made collaborating with ${profileName} special.`}
              placeholderTextColor={C.textMuted}
              value={text}
              onChangeText={onChangeText}
              multiline
              numberOfLines={6}
            />
          </GlassPanel>
          <TouchableOpacity
            style={[eStyles.submitBtn, submitting && eStyles.submitDisabled]}
            onPress={onSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={eStyles.submitText}>Submit Endorsement</Text>}
          </TouchableOpacity>
        </GlassPanel>
      </View>
    </Modal>
  );
}

const makeEStyles = (C: GlassColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderRadius: 28, marginHorizontal: 0, paddingHorizontal: 24, paddingTop: 32 },
  closeBtn: { position: 'absolute', top: 16, right: 20, zIndex: 10, padding: 6 },
  closeText: { fontSize: Math.round(16 * C.textScale), color: C.textMuted, fontWeight: '600' },
  avatarWrap: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.accent },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.accent },
  avatarPlaceholderText: { fontSize: Math.round(14 * C.textScale), color: C.textMuted, fontWeight: '600' },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 6 },
  subheading: { fontSize: Math.round(14 * C.textScale), color: C.textSub, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  inputWrap: { borderRadius: 16, marginBottom: 20 },
  input: { paddingHorizontal: 16, paddingVertical: 14, fontSize: Math.round(15 * C.textScale), color: C.text, minHeight: 130, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: Math.round(16 * C.textScale), fontWeight: '700' },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <GlassPanel style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </GlassPanel>
  );
}

function Header({ navigation, onEdit, onEndorsements }: { navigation: any; onEdit?: () => void; onEndorsements?: () => void }) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <GlassPanel style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerRow}>
        <View style={styles.headerActions}>
          {onEndorsements && (
            <TouchableOpacity onPress={onEndorsements} style={styles.headerIconBtn}>
              <MaterialCommunityIcons name="trophy-outline" size={22} color={C.accent} />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.headerIconBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={22} color={C.accent} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('Search', { screen: 'Settings' })}
            style={styles.headerIconBtn}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={C.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassPanel>
  );
}

const makeStyles = (C: GlassColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  header: { borderRadius: 18, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: { padding: 4 },
  back: { color: C.accent, fontSize: Math.round(15 * C.textScale), marginBottom: 4 },
  heading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text },
  editLink: { color: C.accent, fontSize: Math.round(15 * C.textScale), fontWeight: '600' },

  noProfileCard: { alignItems: 'center', borderRadius: 24, padding: 36 },
  noProfileText: { fontSize: Math.round(26 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 8, marginTop: 16 },
  subtext: { fontSize: Math.round(15 * C.textScale), color: C.textSub, textAlign: 'center', marginBottom: 28 },

  identityRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingHorizontal: 18, paddingVertical: 16,
    marginBottom: 10, gap: 16,
  },
  identityText: { flex: 1 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarLabel: { fontSize: Math.round(16 * C.textScale), color: C.textMuted, fontWeight: '600' },
  username: { fontSize: Math.round(18 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 2 },
  personName: { fontSize: Math.round(15 * C.textScale), color: C.textSub, marginBottom: 2 },
  businessName: { fontSize: Math.round(14 * C.textScale), color: C.textSub, marginBottom: 2 },
  locationText: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, marginTop: 2 },

  tabBar: { flexDirection: 'row', borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: C.accent, borderBottomWidth: 2 },
  tabLabel: { fontSize: Math.round(15 * C.textScale), fontWeight: '600', color: C.textSub },
  tabLabelActive: { color: C.text },

  infoContainer: { paddingBottom: 32 },
  infoRow: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8 },
  infoLabel: { fontSize: Math.round(11 * C.textScale), fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: Math.round(16 * C.textScale), color: C.text },

  contactSectionLabel: {
    fontSize: Math.round(11 * C.textScale), fontWeight: '700', letterSpacing: 1.2,
    color: C.accent, textTransform: 'uppercase',
    marginTop: 16, marginBottom: 8, marginLeft: 2,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8 },
  contactIcon: { fontSize: Math.round(20 * C.textScale), marginRight: 12 },
  contactText: { flex: 1 },
  contactLabel: { fontSize: Math.round(11 * C.textScale), fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { fontSize: Math.round(15 * C.textScale), color: C.accent },
  contactArrow: { fontSize: Math.round(22 * C.textScale), color: C.textMuted, marginLeft: 8 },

  portfolioContainer: { paddingBottom: 32 },
  portfolioHint: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, textAlign: 'center', marginBottom: 16 },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  portfolioSlot: {
    width: '47%', aspectRatio: 1, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border,
  },
  portfolioPanel: {
    flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  portfolioImage: { width: '100%', height: '100%', borderRadius: 16 },
  portfolioEmptyIcon: { fontSize: Math.round(32 * C.textScale), color: C.textMuted, lineHeight: 36 },
  portfolioEmptyLabel: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 4 },

  button: { backgroundColor: C.accent, paddingVertical: 14, paddingHorizontal: 36, borderRadius: 14, alignItems: 'center' },
  saveBtn: { marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },
  cancelButton: { alignItems: 'center', marginTop: 14, paddingVertical: 10 },
  cancelText: { color: C.textSub, fontSize: Math.round(15 * C.textScale) },

  formContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  formHeading: { fontSize: Math.round(22 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 4 },
  label: { fontSize: Math.round(13 * C.textScale), fontWeight: '600', color: C.textSub, marginBottom: 6, marginTop: 14 },
  inputWrap: { borderRadius: 14 },
  input: { paddingHorizontal: 14, paddingVertical: 13, fontSize: Math.round(15 * C.textScale), color: C.text },
  avatarPicker: { alignItems: 'center', marginTop: 4 },
  avatarPreview: { width: 100, height: 100, borderRadius: 50, marginBottom: 8 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: C.border,
  },
  avatarPlaceholderText: { fontSize: Math.round(14 * C.textScale), color: C.textMuted },
  changePhotoText: { color: C.accent, fontSize: Math.round(14 * C.textScale), fontWeight: '600' },
  locOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  locSheet: { borderRadius: 28, marginHorizontal: 0, paddingHorizontal: 20, paddingTop: 20, maxHeight: '75%' },
  locSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  locSheetTitle: { fontSize: Math.round(17 * C.textScale), fontWeight: '700', color: C.text },
  locSheetCancel: { color: C.accent, fontSize: Math.round(15 * C.textScale), fontWeight: '600' },

  locContainer: { paddingBottom: 32, gap: 10 },
  addLocBtn: { backgroundColor: C.accent, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  addLocBtnText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },
  locCard: { borderRadius: 14, overflow: 'hidden' },
  locPhoto: { width: '100%', height: 140 },
  locCardRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },
  locName: { fontSize: Math.round(15 * C.textScale), fontWeight: '700', color: C.text, marginBottom: 3 },
  locAddress: { fontSize: Math.round(13 * C.textScale), color: C.textSub, marginBottom: 3 },
  locDesc: { fontSize: Math.round(13 * C.textScale), color: C.textMuted, lineHeight: 18 },
  locDelete: { paddingLeft: 10, paddingTop: 2 },
  locDeleteText: { fontSize: Math.round(14 * C.textScale), color: C.textMuted, fontWeight: '600' },
  locPhotoPicker: { borderRadius: 14, overflow: 'hidden', height: 160, marginBottom: 4 },
  locPhotoPreview: { width: '100%', height: '100%' },
  locPhotoOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center', justifyContent: 'center' },
  locPhotoOverlayText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },

  endorseContainer: { paddingBottom: 32, gap: 10 },
  writeEndorseBtn: { backgroundColor: C.accent, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 4 },
  writeEndorseBtnText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },
  emptyEndorse: { borderRadius: 18, alignItems: 'center', padding: 36, marginTop: 20 },
  emptyEndorseText: { color: C.textSub, fontSize: Math.round(15 * C.textScale) },
  endorseCard: { borderRadius: 16, padding: 16 },
  endorseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  endorseAuthor: { fontSize: Math.round(14 * C.textScale), fontWeight: '700', color: C.text },
  endorseDate: { fontSize: Math.round(12 * C.textScale), color: C.textMuted },
  endorseBody: { fontSize: Math.round(15 * C.textScale), color: C.textSub, lineHeight: 22 },

  toggleRow: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginTop: 8 },
  toggleTextBlock: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: Math.round(15 * C.textScale), color: C.text, fontWeight: '500' },
  toggleSub: { fontSize: Math.round(12 * C.textScale), color: C.textMuted, marginTop: 2 },

  pickerRow: { borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14 },
  pickerValue: { fontSize: Math.round(15 * C.textScale), color: C.text, flex: 1 },
  pickerPlaceholder: { fontSize: Math.round(15 * C.textScale), color: C.textMuted, flex: 1 },
  pickerChevron: { fontSize: Math.round(16 * C.textScale), color: C.textSub },
  modalOverlay: { flex: 1 },
  pickerSheet: { borderRadius: 24, marginHorizontal: 12, marginBottom: 12, maxHeight: '55%' },
  pickerSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerSheetTitle: { fontSize: Math.round(17 * C.textScale), fontWeight: '600', color: C.text },
  pickerSheetDone: { color: C.accent, fontSize: Math.round(16 * C.textScale), fontWeight: '600' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerItemText: { fontSize: Math.round(16 * C.textScale), color: C.textSub },
  pickerItemSelected: { color: C.text, fontWeight: '600' },
  pickerCheck: { color: C.accent, fontSize: Math.round(16 * C.textScale), fontWeight: '700' },

  pricingRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20 },
  pricingChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: C.accentSubtle, borderWidth: 1, borderColor: C.border },
  pricingChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  pricingChipText: { fontSize: Math.round(15 * C.textScale), fontWeight: '700', color: C.textSub },
  pricingChipTextActive: { color: '#fff' },

  // Store tab
  storeContainer: { paddingBottom: 32, gap: 10 },
  addStoreBtn: { backgroundColor: C.accent, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  addStoreBtnText: { color: '#fff', fontSize: Math.round(15 * C.textScale), fontWeight: '700' },
  storeCard: { borderRadius: 18, overflow: 'hidden' },
  storeCardImage: { width: '100%', height: 180 },
  storeCardBody: { padding: 14 },
  storeCardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  storeCardTitle: { flex: 1, fontSize: Math.round(16 * C.textScale), fontWeight: '700', color: C.text },
  storeCardPrice: { fontSize: Math.round(15 * C.textScale), fontWeight: '700', color: C.accent },
  storeCardDelete: { paddingLeft: 6, paddingTop: 2 },
  storeCardDeleteText: { fontSize: Math.round(14 * C.textScale), color: C.textMuted, fontWeight: '600' },
  storeCardDesc: { fontSize: Math.round(13 * C.textScale), color: C.textSub, lineHeight: 19, marginBottom: 8 },
  storeCardLink: { fontSize: Math.round(14 * C.textScale), fontWeight: '700', color: C.accent },
});
