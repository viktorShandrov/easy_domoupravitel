import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// 1. Регистрираме шрифт с Кирилица (Много важно!)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

// 2. Стилове
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, color: '#333' },
  header: { marginBottom: 20, borderBottom: '2px solid #333', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 5, textAlign: 'center', textTransform: 'uppercase' },
  subtitle: { fontSize: 12, textAlign: 'center', color: '#666' },
  section: { marginVertical: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 5, backgroundColor: '#f3f4f6', padding: 5 },
  row: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingVertical: 4, alignItems: 'center' },
  headerRow: { flexDirection: 'row', borderBottom: '1px solid #333', paddingVertical: 5, backgroundColor: '#e5e7eb', fontWeight: 700 },
  col1: { width: '15%' },
  col2: { width: '45%' },
  col3: { width: '25%' },
  col4: { width: '15%', textAlign: 'right' },
  totalRow: { flexDirection: 'row', marginTop: 5, paddingTop: 5, borderTop: '1px solid #333', fontWeight: 700 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: 10 },
  qrCode: { width: 50, height: 50 },
  debtorRow: { flexDirection: 'row', paddingVertical: 2, color: '#b91c1c' },
  signatureBox: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureLine: { width: '40%', borderTop: '1px solid #333', textAlign: 'center', paddingTop: 5 }
});

// Helper за дата
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('bg-BG');
}

// --- КОМПОНЕНТ 1: МЕСЕЧЕН ОТЧЕТ ---
export const MonthlyReportPDF = ({ data, qrCodeUrl }) => {
    const totalIncome = data.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = data.expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Месечен Финансов Отчет</Text>
                    <Text style={styles.subtitle}>{data.buildingName}</Text>
                    <Text style={styles.subtitle}>{data.address}</Text>
                    <Text style={{ textAlign: 'center', marginTop: 5, fontWeight: 700 }}>
                        Период: {data.period.month} / {data.period.year}
                    </Text>
                </View>

                {/* Баланс */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#f0fdf4', padding: 10, borderRadius: 5 }}>
                    <View>
                        <Text style={{ fontSize: 9, color: '#666' }}>Начално Салдо:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700 }}>{data.openingBalance.toFixed(2)} лв.</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9, color: '#666' }}>Приходи:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: 'green' }}>+{totalIncome.toFixed(2)} лв.</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9, color: '#666' }}>Разходи:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 700, color: 'red' }}>-{totalExpense.toFixed(2)} лв.</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 9, color: '#666' }}>Крайно Салдо:</Text>
                        <Text style={{ fontSize: 14, fontWeight: 700, color: 'blue' }}>{data.closingBalance.toFixed(2)} лв.</Text>
                    </View>
                </View>

                {/* Разходи */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📉 РАЗХОДИ ЗА МЕСЕЦА</Text>
                    <View style={styles.headerRow}>
                        <Text style={styles.col1}>Дата</Text>
                        <Text style={{ width: '65%' }}>Описание</Text>
                        <Text style={{ width: '20%', textAlign: 'right' }}>Сума</Text>
                    </View>
                    {data.expenses.length === 0 ? (
                        <Text style={{ padding: 10, textAlign: 'center', color: '#999' }}>Няма разходи за периода</Text>
                    ) : (
                        data.expenses.map((exp, i) => (
                            <View key={i} style={styles.row}>
                                <Text style={styles.col1}>{formatDate(exp.date)}</Text>
                                <Text style={{ width: '65%' }}>{exp.description}</Text>
                                <Text style={{ width: '20%', textAlign: 'right' }}>-{exp.amount.toFixed(2)}</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Длъжници */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { backgroundColor: '#fef2f2', color: '#b91c1c' }]}>⚠️ СПИСЪК ДЛЪЖНИЦИ</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {data.debtors.length === 0 ? (
                            <Text style={{ padding: 10, color: 'green' }}>Поздравления! Няма длъжници.</Text>
                        ) : (
                            data.debtors.map((d, i) => (
                                <View key={i} style={{ width: '50%', flexDirection: 'row', justifyContent: 'space-between', paddingRight: 10, marginBottom: 4 }}>
                                    <Text>{d.number} ({d.ownerName})</Text>
                                    <Text style={{ fontWeight: 700, color: '#b91c1c' }}>{d.amount.toFixed(2)} лв.</Text>
                                </View>
                            ))
                        )}
                    </View>
                </View>
                
                {/* Footer с QR код */}
                <View style={styles.footer}>
                    <View>
                        <Text style={{ fontSize: 8, color: '#999' }}>Генерирано от Easy Domoupravitel</Text>
                        <Text style={{ fontSize: 8, color: '#999' }}>{new Date().toLocaleString('bg-BG')}</Text>
                    </View>
                    {qrCodeUrl && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, marginRight: 5 }}>Сканирай за дигитален отчет</Text>
                            <Image src={qrCodeUrl} style={styles.qrCode} />
                        </View>
                    )}
                </View>
            </Page>
        </Document>
    );
};

// --- КОМПОНЕНТ 2: ДОМОВА КНИГА ---
export const HouseBookPDF = ({ building }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>ДОМОВА КНИГА</Text>
                <Text style={styles.subtitle}>на Етажна Собственост: {building.address}</Text>
            </View>

            <View style={styles.headerRow}>
                <Text style={{ width: '15%' }}>Ап. №</Text>
                <Text style={{ width: '45%' }}>Собственик</Text>
                <Text style={{ width: '20%', textAlign: 'center' }}>Живущи</Text>
                <Text style={{ width: '20%', textAlign: 'right' }}>Баланс</Text>
            </View>

            {building.apartments.map((apt, i) => (
                <View key={i} style={styles.row}>
                    <Text style={{ width: '15%' }}>{apt.number}</Text>
                    <Text style={{ width: '45%' }}>{apt.ownerName}</Text>
                    <Text style={{ width: '20%', textAlign: 'center' }}>{apt.residents}</Text>
                    <Text style={{ width: '20%', textAlign: 'right' }}>{apt.balance.toFixed(2)} лв.</Text>
                </View>
            ))}

            <View style={{ marginTop: 30 }}>
                <Text style={{ fontSize: 10, color: '#666' }}>
                    Настоящата книга е съставена съгласно изискванията на ЗУЕС.
                </Text>
            </View>
        </Page>
    </Document>
);

// --- КОМПОНЕНТ 3: ПОКАНА ЗА ОС ---
export const InvitationPDF = ({ building, formData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={{ alignItems: 'center', marginBottom: 30 }}>
                <Text style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>ПОКАНА</Text>
                <Text style={{ fontSize: 12 }}>за свикване на Общо събрание на етажната собственост</Text>
                <Text style={{ fontSize: 12, marginTop: 5 }}>Адрес: {building.address}</Text>
            </View>

            <Text style={{ marginBottom: 10 }}>Уважаеми съседи,</Text>
            <Text style={{ marginBottom: 20, lineHeight: 1.5 }}>
                Управителният съвет (Домоуправителят) свиква редовно Общо събрание, което ще се проведе на:
            </Text>

            <View style={{ marginLeft: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: 700 }}>Дата: {new Date(formData.date).toLocaleDateString('bg-BG')}</Text>
                <Text style={{ fontSize: 14, fontWeight: 700 }}>Час: {formData.time}</Text>
                <Text style={{ fontSize: 14, fontWeight: 700 }}>Място: {formData.location}</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, textDecoration: 'underline' }}>ДНЕВЕН РЕД:</Text>
            
            {formData.agenda.split('\n').map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 5 }}>
                    <Text style={{ width: 20, fontWeight: 700 }}>{i + 1}.</Text>
                    <Text>{item}</Text>
                </View>
            ))}

            <Text style={{ marginTop: 30, fontSize: 10, color: '#666' }}>
                * При липса на кворум, събранието ще се проведе един час по-късно на същото място и при същия дневен ред, независимо от броя на присъстващите.
            </Text>

            <View style={styles.signatureBox}>
                <View style={styles.signatureLine}>
                    <Text>Домоуправител (Подпис)</Text>
                </View>
                <View style={{ width: '40%', textAlign: 'right' }}>
                    <Text>Дата: {new Date().toLocaleDateString('bg-BG')}</Text>
                </View>
            </View>
        </Page>
    </Document>
);