const sliderChangeSide = (a, activePageIndex, prevPageIndex) => {             
    return getSlideAction(a, activePageIndex, prevPageIndex);  
}

const getSlideAction = (index, activePageIndex, prevPageIndex) => {
    if (index === 0 && activePageIndex === 2) {
        return onSliderRigth(index);
    } else if (index === 2 && activePageIndex === 0) {
        return onSliderLeft(index);
    } else if (activePageIndex < index) {
        return onSliderRigth(index);                
    } else if (activePageIndex > index) {
        return onSliderLeft(index);                
    } else if (prevPageIndex > index) {          
        return onSliderRigth(index);   
    } else if (prevPageIndex < index) {                      
        return onSliderLeft(index);            
    }
}

const onSliderRigth = (index, activePageIndex, prevPageIndex) => {                                                                                             
    let nextIndex = index + 1;
    if (nextIndex > 2) {
        nextIndex = 0;
    };
    prevPageIndex = activePageIndex;
    activePageIndex = index; 
    return {
        index, 
        nextIndex, 
        side: 'right',
        prevPageIndex,
        activePageIndex
    }
}

const onSliderLeft = (index, activePageIndex, prevPageIndex) => {                                                                    
    let nextIndex = index - 1;
    if (nextIndex < 0) {
        nextIndex = 2;
    };
    prevPageIndex = activePageIndex;        
    activePageIndex = index; 
    return {
        index, 
        nextIndex, 
        side: 'left',
        prevPageIndex,
        activePageIndex
    }
}

export default sliderChangeSide;