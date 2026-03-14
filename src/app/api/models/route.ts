import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Filter out models that support generateContent
        const textModels = data.models.filter((model: any) => 
            model.supportedGenerationMethods && 
            model.supportedGenerationMethods.includes('generateContent')
        ).map((model: any) => ({
            id: model.name.replace('models/', ''),
            name: model.displayName || model.name.replace('models/', ''),
            description: model.description
        }));

        return NextResponse.json({ models: textModels });
    } catch (error) {
        console.error('Error fetching models:', error);
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }
}
