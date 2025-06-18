#!/bin/bash

# ESP32 Alarm System - Deployment Script
# This script helps deploy the API server to various hosting services

echo "🚀 ESP32 Alarm System - Deployment Helper"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if git is installed
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    print_status "Git is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    print_status "npm is installed"
}

# Test local server
test_local() {
    print_info "Testing local server..."
    
    # Install dependencies
    npm install
    
    # Start server in background
    npm start &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test endpoint
    if curl -s http://localhost:3000/ > /dev/null; then
        print_status "Local server is working!"
        kill $SERVER_PID
    else
        print_error "Local server test failed"
        kill $SERVER_PID
        exit 1
    fi
}

# Deploy to Railway
deploy_railway() {
    print_info "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    print_info "Please login to Railway..."
    railway login
    
    # Initialize project
    railway init
    
    # Deploy
    railway up
    
    print_status "Deployment to Railway completed!"
    print_info "Your API will be available at the URL provided by Railway"
}

# Deploy to Render
deploy_render() {
    print_info "To deploy to Render:"
    echo "1. Push your code to GitHub"
    echo "2. Go to https://render.com"
    echo "3. Create a new Web Service"
    echo "4. Connect your GitHub repository"
    echo "5. Use these settings:"
    echo "   - Build Command: npm install"
    echo "   - Start Command: npm start"
    echo "   - Environment: Node.js"
    echo "6. Add environment variables:"
    echo "   - MONGODB_URI: your MongoDB connection string"
    echo "   - NODE_ENV: production"
    
    print_warning "Remember to update your ESP32 code with the new server URL!"
}

# Deploy to Vercel
deploy_vercel() {
    print_info "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy
    vercel --prod
    
    print_status "Deployment to Vercel completed!"
}

# Main menu
show_menu() {
    echo "Please choose a deployment option:"
    echo "1. Test locally first"
    echo "2. Deploy to Railway (Recommended)"
    echo "3. Deploy to Render (Manual steps)"
    echo "4. Deploy to Vercel"
    echo "5. Show environment variables template"
    echo "6. Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            test_local
            ;;
        2)
            deploy_railway
            ;;
        3)
            deploy_render
            ;;
        4)
            deploy_vercel
            ;;
        5)
            show_env_template
            ;;
        6)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            show_menu
            ;;
    esac
}

# Show environment variables template
show_env_template() {
    print_info "Environment Variables Template:"
    echo ""
    echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
    echo "NODE_ENV=production"
    echo "PORT=3000"
    echo "LATEST_VERSION=0.2.0"
    echo ""
    print_warning "Don't forget to replace the MongoDB URI with your actual connection string!"
    echo ""
    show_menu
}

# Main execution
main() {
    # Check prerequisites
    check_git
    check_npm
    
    # Show menu
    show_menu
}

# Run main function
main 