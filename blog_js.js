$(document).ready(function($) {
	
	$('ul#paging-arrows li#newer').hover(
		function(){
			$(this).animate({
				'padding-left' : '30px',
				'opacity' : '0.9'
			},100).children().animate({
				'margin-left' : '-12px'
			},100);
		},
		function(){
			$(this).animate({
				'padding-left' : '10px',
				'opacity' : '0.8'
			},100).children().animate({
				'margin-left' : '0'
			},100);
		}
	);

	$('ul#paging-arrows li#older').hover(
		function(){
			$(this).animate({
				'padding-right' : '30px',
				'opacity' : '0.9'
			},100).children().animate({
				'margin-left' : '12px'
			},100);
		},
		function(){
			$(this).animate({
				'padding-right' : '10px',
				'opacity' : '0.8'
			},100).children().animate({
				'margin-left' : '0'
			},100);
		}
	);


});